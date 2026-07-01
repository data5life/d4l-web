import { calculateIteration } from '@/lib/iterationCalculator';
import { prisma } from '@/lib/prisma';
import { createUnsubscribeToken } from '@/lib/unsubscribeToken';
import { TaskFrequency } from '@d4l/collect-lib';
import { shouldSendNotifications } from '@/lib/notificationFilter';
import * as fs from 'fs';
import { Messages } from 'next-intl';
import * as path from 'path';

// Five minutes
const INTERVAL_MS = 5 * 60 * 1000;

const baseUrl = process.env.AUTH_URL || 'http://localhost:3000';

/**
 * Helper to safely extract nested JSON translation keys.
 */
function getTranslation(messages: Messages, key: string): string {
  const keys = key.split('.');
  let result = messages;
  for (const k of keys) {
    result = result?.[k];
  }
  return typeof result === 'string' ? result : key;
}

async function startSchedulerWorker(): Promise<void> {
  console.log(`Scheduler worker started successfully (Interval: ${INTERVAL_MS}ms)...`);

  while (true) {
    try {
      const now = new Date();

      // Fetch due notification jobs along with user data for locale and email routing
      const dueNotifications = await prisma.notificationJob.findMany({
        where: { runAt: { lte: now } },
        include: { user: { include: { notificationPreferences: true } } },
      });

      if (dueNotifications.length > 0) {
        console.log(`Processing ${dueNotifications.length} due notification(s)...`);
        const localesRegistry: Messages = {};

        await prisma.$transaction(async (tx) => {
          for (const notification of dueNotifications) {
            const shouldSend = shouldSendNotifications(
              notification.user.notificationsEnabled,
              notification.user.notificationPreferences,
              notification.programId,
            );

            if (shouldSend) {
              const locale = notification.user.preferredLanguage;

              if (!localesRegistry[locale]) {
                const localePath = path.join(process.cwd(), `messages/${locale}.json`);
                try {
                  localesRegistry[locale] = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
                } catch {
                  console.error(
                    `Could not read messages for locale: ${locale}, falling back to English.`,
                  );
                  // Fallback mechanics to prevent crashing the worker batch
                  if (locale !== 'en' && !localesRegistry['en']) {
                    const enPath = path.join(process.cwd(), 'messages/en.json');
                    localesRegistry['en'] = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
                  }
                  localesRegistry[locale] = localesRegistry['en'] || {};
                }
              }

              const messages = localesRegistry[locale];

              const subject = getTranslation(messages, 'notification.generic.subject');
              const titleText = getTranslation(messages, 'notification.generic.title');
              const bodyText = getTranslation(messages, 'notification.generic.body');
              const buttonText = getTranslation(messages, 'notification.generic.button');
              const footerText = getTranslation(messages, 'notification.generic.footer');
              const unsubscribeLinkText = getTranslation(
                messages,
                'notification.generic.unsubscribe',
              );

              // Secure generic fallback path using the identifier (token or id)
              // Constructing the exact context URL from your E2EE routing structure
              const questionnaireUrl = [
                baseUrl,
                locale,
                'dashboard',
                'program',
                notification.programId,
                notification.questionnaireName,
              ].join('/');

              // Stateless unsubscribe token ties this email to (user, program)
              // without a session. Landing page is GET (visible link); the
              // one-click URL is the RFC 8058 POST target.
              const unsubscribeToken = createUnsubscribeToken({
                userId: notification.userId,
                programId: notification.programId,
              });
              const unsubscribeUrl = `${baseUrl}/${locale}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
              const oneClickUrl = `${baseUrl}/api/notifications/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

              const htmlBody = `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 24px 32px; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 20px;">${titleText}</h1>
                  </div>
                  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">${bodyText}</p>
                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${questionnaireUrl}" style="display: inline-block; padding: 12px 32px; background: #7c3aed; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                        ${buttonText}
                      </a>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">${footerText}</p>
                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;"><a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">${unsubscribeLinkText}</a></p>
                  </div>
                </div>
              `;

              await tx.mailJob.create({
                data: {
                  toEmail: notification.user.email,
                  subject: subject,
                  body: htmlBody,
                  // RFC 2369 / RFC 8058 — surfaces a native "Unsubscribe"
                  // button in Gmail/Apple Mail and similar clients.
                  headers: {
                    'List-Unsubscribe': `<${oneClickUrl}>, <${unsubscribeUrl}>`,
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                  },
                },
              });
            }

            let nextRunDate: Date | undefined;
            const freq = notification.frequency as TaskFrequency;
            if (freq.type !== 'single' && freq.type !== 'onDemand') {
              const it = calculateIteration(freq, notification.user.timeZone);

              if (it.status === 'active' && !it.info.isLastIteration) {
                nextRunDate = it.info.iterationEnd;
              }
            }
            if (nextRunDate) {
              await tx.notificationJob.update({
                where: { id: notification.id },
                data: {
                  runAt: nextRunDate,
                },
              });
            } else {
              await tx.notificationJob.delete({
                where: { id: notification.id },
              });
            }
          }
        });

        console.log(
          `Successfully converted ${dueNotifications.length} notifications to generic mail jobs.`,
        );
      }
    } catch (error) {
      console.error('Error during scheduler worker execution loop:', error);
    }

    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

startSchedulerWorker().catch((error) => {
  console.error('Critical failure in scheduler worker:', error);
  process.exit(1);
});
