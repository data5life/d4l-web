import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { addSessionCookie, getTask } from './utils/utils';
import { DonorIdentity } from '@d4l/collect-lib';

test.describe('Dashboard for Authenticated User', () => {
  let sharedUserId: string;
  const sessionToken = 'fake-session-token-dashboard';

  test.beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-dashboard@example.com',
        name: 'Test User Dashboard',
        recoveryKey: new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      },
    });
    sharedUserId = user.id;

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

    await prisma.enrollment.create({
      data: {
        userId: user.id,
        programId: 'test_suite1',
        did,
        subjectId: '000',
      },
    });
  });

  test.afterAll(async () => {
    await prisma.user.delete({ where: { id: sharedUserId } });
  });

  test.beforeEach(async ({ context }) => {
    addSessionCookie(context, sessionToken);
  });

  test('Logout button for authenticated users', async ({ page }) => {
    await page.goto('/en/dashboard/program/test_suite1');
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('Delayed questionnaire is visible and disabled', async ({ page }) => {
    await page.goto('/en/dashboard/program/test_suite1');
    await page.waitForLoadState('networkidle');
    const delayedQuestionnaire = page.getByRole('button', { name: /delayed questionnaire/i });

    await expect(delayedQuestionnaire).toBeVisible();
    await expect(delayedQuestionnaire).toBeDisabled();
  });

  test('Recurring questionnaire submitted today is disabled', async ({ page }) => {
    await page.goto('/en/dashboard/program/test_suite1');

    const recurringQuestionnaire = getTask(page, /recurring today/i);

    // Questionnaire should be visible but disabled
    await expect(recurringQuestionnaire).toBeVisible();
    await expect(recurringQuestionnaire).toBeDisabled();
  });

  test('Recurring questionnaire submitted in the past is available', async ({ page }) => {
    await page.goto('/en/dashboard/program/test_suite1');

    const recurringQuestionnaire = getTask(page, /recurring past/i);

    // Questionnaire should be visible and not disabled
    await expect(recurringQuestionnaire).toBeVisible();
    await expect(recurringQuestionnaire).toBeEnabled();
  });
});
