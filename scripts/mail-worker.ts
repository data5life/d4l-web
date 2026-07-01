// NOTE: If the mail worker crashes after while sending the mails to resend and resend
// accepts the request, its possible that we send the same mail twice, because the mail
// job gets deleted after a successful request
import { prisma } from '@/lib/prisma';
import os from 'os';

const INTERVAL_MS = process.env.MAIL_WORKER_INTERVAL_MS
  ? parseInt(process.env.MAIL_WORKER_INTERVAL_MS, 10)
  : 10 * 1000;

// Resend has a rate limit of 5 request per second
// sending a request every second should be safe for now without running into rate limits
const MIN_INTERVAL_MS = 1_000;

const MAX_RETRY_COUNT = process.env.MAIL_WORKER_MAX_RETRIES
  ? parseInt(process.env.MAIL_WORKER_MAX_RETRIES, 10)
  : 5;

const RESEND_API_KEY = process.env.EMAIL_SERVER_PASSWORD;
const fromAddress = process.env.EMAIL_FROM;

const FATAL_ERROR_NAMES = new Set([
  // Config errors
  'missing_api_key',
  'restricted_api_key',
  'invalid_api_key',
  'invalid_access',
  'invalid_from_address',

  // Malformed payload errors
  'validation_error',
  'invalid_attachment',
  'missing_required_field',
  'invalid_parameter',
  'invalid_region',
  'invalid_idempotency_key',
]);

const SIGINT_NUM = os.constants.signals.SIGINT;
const SIGTERM_NUM = os.constants.signals.SIGTERM;

type BatchErrorAction = 'exit' | 'retry';

interface BatchErrorResult {
  action: BatchErrorAction;
  message: string;
}

/**
 * Classifies a non-2xx Resend API response into an action for the caller.
 * Pure function — no side effects.
 */
async function classifyBatchError(response: Response): Promise<BatchErrorResult> {
  const body: { name?: string; message?: string } = await response.json().catch(() => ({}));
  const name = body.name ?? 'unknown';
  const message = body.message ?? '(no message)';
  const label = `HTTP ${response.status}, name="${name}": ${message}`;

  if (response.status === 401) {
    return { action: 'exit', message: `Unrecoverable auth error — ${label}` };
  }

  if (response.status === 403) {
    if (FATAL_ERROR_NAMES.has(name)) {
      return { action: 'exit', message: `Permanent config error — ${label}` };
    }
    return { action: 'retry', message: `Non-fatal 403, skipping batch — ${label}` };
  }

  if (response.status === 422) {
    if (FATAL_ERROR_NAMES.has(name)) {
      return { action: 'exit', message: `Permanent misconfiguration — ${label}` };
    }
    return { action: 'retry', message: `Unknown 422 error, skipping batch — ${label}` };
  }

  if (response.status === 429) {
    return { action: 'retry', message: `Rate/quota limited, backing off — ${label}` };
  }

  return { action: 'retry', message: `Transient error, will retry — ${label}` };
}

let pendingExitCode = 0;
let isProcessing = false;
let activeTimeout: NodeJS.Timeout | null = null;

async function startMailWorker(): Promise<void> {
  console.log(`Mail worker started (interval: ${INTERVAL_MS}ms, maxRetries: ${MAX_RETRY_COUNT})`);

  if (!RESEND_API_KEY) {
    console.error('Fatal: EMAIL_SERVER_PASSWORD is not defined.');
    process.exit(1);
  }
  if (!fromAddress) {
    console.error('Fatal: EMAIL_FROM is not defined.');
    process.exit(1);
  }

  let hasFullBatch = false;
  while (true) {
    isProcessing = true;
    try {
      const pendingMails = await prisma.mailJob.findMany({
        take: 100,
        orderBy: { createdAt: 'asc' },
      });
      hasFullBatch = pendingMails.length === 100;

      if (pendingMails.length > 0) {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`Processing batch of ${pendingMails.length} email(s)...`);

        const batchPayload = pendingMails.map((mail) => {
          const payload: Record<string, unknown> = {
            from: fromAddress,
            to: mail.toEmail,
            subject: mail.subject,
            html: mail.body,
          };
          // Forward per-message headers (e.g. List-Unsubscribe) when present.
          if (mail.headers) payload.headers = mail.headers;
          return payload;
        });

        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchPayload),
        });

        if (!response.ok) {
          const { action, message } = await classifyBatchError(response);
          console.error(`Batch error [${action}]: ${message}`);

          if (action === 'exit') process.exit(1);

          await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
          continue;
        }

        await prisma.mailJob.deleteMany({
          where: { id: { in: pendingMails.map((m) => m.id) } },
        });

        console.log(`Delivered ${pendingMails.length} email(s), cleared from queue.`);
      }
    } catch (error) {
      console.error('Unexpected exception in execution loop:', error);
    }

    isProcessing = false;
    if (pendingExitCode > 0) process.exit(pendingExitCode);

    await new Promise<void>((resolve) => {
      activeTimeout = setTimeout(
        () => {
          activeTimeout = null;
          resolve();
        },
        hasFullBatch ? MIN_INTERVAL_MS : INTERVAL_MS,
      );
    });
  }
}

function handleShutdown(signal: number) {
  const exitCode = 128 + signal;
  if (isProcessing) {
    pendingExitCode = exitCode;
    return;
  }
  if (activeTimeout) clearTimeout(activeTimeout);
  process.exit(exitCode);
}

startMailWorker().catch((error) => {
  console.error('Critical failure in mail worker:', error);
  process.exit(1);
});

process.on('SIGINT', () => handleShutdown(SIGINT_NUM));
process.on('SIGTERM', () => handleShutdown(SIGTERM_NUM));
