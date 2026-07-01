import { NextRequest, NextResponse } from 'next/server';
import { shouldSendNotifications } from '@/lib/notificationFilter';
import { prisma } from '@/lib/prisma';
import {
  ParseError,
  validateNonEmptyString,
  validateObject,
  validateString,
  validateStringArray,
} from '@/lib/fhir-parser/helper';

type EmailContent = {
  subjectline: string;
  message: string;
};

function validateMailObject(
  test: unknown,
  path: string,
  languages: string[],
): asserts test is Record<string, EmailContent> {
  validateObject(test, path);
  for (const lang of languages) {
    const template = test[lang];
    const templatePath = `${path}[${lang}]`;
    validateObject(template, templatePath);
    validateNonEmptyString(template.subjectline, `${templatePath}.subjectline`);
    validateNonEmptyString(template.message, `${templatePath}.message`);
  }
}

function resolveEmailLanguage(
  userPreferredLanguage: string,
  languages: string[],
  defaultLanguage: string,
): string {
  const lang =
    userPreferredLanguage && languages.includes(userPreferredLanguage)
      ? userPreferredLanguage
      : defaultLanguage;

  return lang;
}

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get('x-email-secret');
    if (secretHeader !== process.env.INTERNAL_EMAIL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as unknown;

    try {
      validateObject(body, 'request');
      validateStringArray(body.subjects, 'request.subjects');
      validateStringArray(body.languages, 'request.languages');
      validateString(body.defaultLanguage, 'request.defaultLanguage');
      validateMailObject(body.email, 'request.email', body.languages);
    } catch (e) {
      if (e instanceof ParseError) {
        return NextResponse.json(
          { error: `${e.message}, expected: ${e.expected}` },
          { status: 400 },
        );
      }
      throw e;
    }

    if (!body.languages.includes(body.defaultLanguage)) {
      return NextResponse.json(
        { error: 'defaultLanguage must be included in languages' },
        { status: 400 },
      );
    }

    if (body.subjects.length > 500) {
      return NextResponse.json({ error: 'Too many subjects in one request' }, { status: 413 });
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        subjectId: { in: body.subjects },
      },
      include: {
        user: {
          include: {
            notificationPreferences: { select: { programId: true, enabled: true } },
          },
        },
      },
    });

    const enrolledSubjects = new Set(enrollments.map((e) => e.subjectId));
    const results: { subjectId: string; status: 'accepted' | 'skipped'; reason?: string }[] = [];

    for (const subjectId of body.subjects) {
      if (!enrolledSubjects.has(subjectId)) {
        results.push({
          subjectId: String(subjectId),
          status: 'skipped',
          reason: 'Subject not found',
        });
      }
    }

    const mailJobsToCreate = [];
    for (const enrollment of enrollments) {
      const user = enrollment.user;

      // Honor the user's notification opt-out (global + per-program), using the
      // same rule as the reminder scheduler so a disabled user never receives
      // contact emails either.
      if (
        !shouldSendNotifications(
          user.notificationsEnabled,
          user.notificationPreferences,
          enrollment.programId,
        )
      ) {
        results.push({
          subjectId: enrollment.subjectId,
          status: 'skipped',
          reason: 'Notifications disabled',
        });
        continue;
      }

      const lang = resolveEmailLanguage(
        user.preferredLanguage,
        body.languages,
        body.defaultLanguage,
      );

      const template = body.email[lang];

      results.push({ subjectId: enrollment.subjectId, status: 'accepted' });
      mailJobsToCreate.push({
        toEmail: user.email,
        subject: template.subjectline,
        body: template.message,
      });
    }
    if (mailJobsToCreate.length > 0) {
      await prisma.mailJob.createMany({
        data: mailJobsToCreate,
      });
    }

    const skipped = results.filter((r) => r.status === 'skipped').length;
    const accepted = results.filter((r) => r.status === 'accepted').length;

    return NextResponse.json(
      {
        result: results,
        summary: {
          skipped,
          accepted,
        },
      },
      { status: 202 },
    );
  } catch (error) {
    console.error('Error in /api/v1/email', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
