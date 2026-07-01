import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { addSessionCookie, getDivByHeading } from './utils/utils';
import { Locale, localeNames, locales } from '@/i18n/config';
import { Record } from '@prisma/client/runtime/client';

import en from '../messages/en.json' with { type: 'json' };
import de from '../messages/de.json' with { type: 'json' };
import { DonorIdentity } from '@d4l/collect-lib';

const messages: Record<Locale, typeof en> = {
  de,
  en,
};

// This is a broad localization test suite, not an exhaustive content audit.
// It verifies that key UI anchors (headings, buttons) are translated and
// that routes are functional across all locales.
test.describe('Language Localization', () => {
  let sharedUserId: string;
  const sessionToken = 'fake-session-token-i18n';

  test.beforeAll(async () => {
    // 1. Create user
    const user = await prisma.user.create({
      data: {
        email: 'test-i18n@example.com',
        name: 'Test User i18n',
        recoveryKey: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      },
    });
    sharedUserId = user.id;

    // 2. Create session
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires: new Date(Date.now() + 3600 * 1000),
      },
    });

    const did: DonorIdentity = {
      t: 'data-donation',
      keys: { priv: '', pub: '', rec: '' },
      v: 2,
      scope: 'test_suite1',
    };
    // 3. Enroll user in program
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        programId: 'test_i18n',
        did,
        subjectId: '000',
      },
    });
  });

  test.afterAll(async () => {
    // 4. Cleanup
    await prisma.user.delete({ where: { id: sharedUserId } });
  });

  for (const locale of locales) {
    const localeName = localeNames[locale];
    const t = messages[locale];

    test(`Login is correctly in ${locale}`, async ({ page }) => {
      await page.goto(`/${locale}/login`);

      const title = page.getByRole('heading', { name: t.login.title });
      await expect(title).toBeVisible();
    });

    test.describe(`Logged in User - ${locale}`, () => {
      test.beforeEach(async ({ context }) => {
        await addSessionCookie(context, sessionToken);
      });

      test(`Settings is correctly in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}/dashboard/settings`);

        const title = page.getByRole('heading', { name: t.settings.title });
        await expect(title).toBeVisible();

        const deleteAccButton = page.getByRole('button', { name: t.settings.deleteButton });
        await expect(deleteAccButton).toBeVisible();
      });

      test(`Program dashboard is correctly in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}/dashboard/program/test_i18n`);

        const breadcrumb = page.getByTestId('breadcrumbs');
        await expect(breadcrumb).toBeVisible();

        const dashboardCrumb = breadcrumb.getByRole('link', { name: t.common.dashboard });
        await expect(dashboardCrumb).toBeVisible();

        await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
          'Title in ' + localeName,
        );

        const logOut = page.getByRole('button', { name: t.common.logout });
        await expect(logOut).toBeVisible();

        const settings = page.getByRole('link', { name: t.common.settings });
        await expect(settings).toBeVisible();

        const availableTasks = page.getByRole('heading', { name: t.program.availableTasks });
        await expect(availableTasks).toBeVisible();
      });

      test(`Study is correctly in ${locale}`, async ({ page }) => {
        await page.goto(`/${locale}/dashboard/program/test_i18n`);

        await expect(page.getByRole('heading', { name: `Title in ${localeName}` })).toBeVisible();

        // Open the collapsible section
        await page.getByRole('button', { name: t.program.descriptionAndContact }).click();

        const desciption = getDivByHeading(page, t.program.description);
        await expect(desciption.getByText(`Description in ${localeName}`)).toBeVisible();

        const contactInfo = getDivByHeading(page, t.program.contactInformation);
        await expect(contactInfo.getByText(`Contact in ${localeName}`)).toBeVisible();
      });
    });
  }
});
