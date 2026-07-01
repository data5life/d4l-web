import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { addSessionCookie } from './utils/utils';
import { DonorIdentity } from '@d4l/collect-lib';

test.describe('Enrollment', () => {
  let sharedUserId: string;
  let preEnrollmentObj: {
    userId: string;
    programId: string;
    did: DonorIdentity;
    subjectId: string;
  };
  const sessionToken = 'fake-session-token-enrollment';

  test.beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-enrollment@example.com',
        name: 'Test User Enrollment',
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
    preEnrollmentObj = {
      userId: sharedUserId,
      programId: 'test_suite1',
      did,
      subjectId: '000',
    };
  });

  test.afterAll(async () => {
    await prisma.user.delete({ where: { id: sharedUserId } });
  });

  test.beforeEach(async ({ context }) => {
    await addSessionCookie(context, sessionToken);

    // Reset enrollment state before each test
    await prisma.enrollment.deleteMany({
      where: { userId: sharedUserId, programId: 'test_suite1' },
    });
  });

  test('Enroll button is visible when user is not enrolled', async ({ page }) => {
    await page.goto('/en/program/test_suite1');

    await expect(page.getByRole('button', { name: /enroll/i })).toBeVisible();
  });

  test('User views the public page when not enrolled', async ({ page }) => {
    await page.goto('/en/program/test_suite1');

    await expect(page.getByTestId('task-list')).not.toBeVisible();
  });

  test('Clicking Enroll enrolls the user and redirects to program dashboard', async ({ page }) => {
    await page.goto('/en/dashboard/program/test_suite1');

    await page.getByRole('button', { name: /enroll/i }).click();

    await expect(page).toHaveURL('en/dashboard/program/test_suite1');

    // Withdraw button should now be visible
    await expect(page.getByRole('button', { name: /withdraw/i })).toBeVisible();

    // Verify in DB
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_programId: {
          userId: sharedUserId,
          programId: 'test_suite1',
        },
      },
    });
    expect(enrollment).not.toBeNull();
  });

  test('Withdraw shows a confirmation dialog', async ({ page }) => {
    // Pre-enroll the user
    await prisma.enrollment.create({
      data: preEnrollmentObj,
    });

    await page.goto('/en/dashboard/program/test_suite1');

    await page.getByRole('button', { name: /withdraw/i }).click();

    // Custom confirmation dialog appears with the warning
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(
      'Withdrawing from the study will not delete your data. Revoke your consent, if you want to delete all data.',
    );

    // Cancel — user changes their mind
    await dialog.getByRole('button', { name: /cancel/i }).click();

    // Dialog closes; enrollment should still exist since user cancelled
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: /withdraw/i })).toBeVisible();
  });

  test('Clicking Withdraw removes enrollment and redirects to dashboard', async ({ page }) => {
    // Pre-enroll the user
    await prisma.enrollment.create({
      data: preEnrollmentObj,
    });

    await page.goto('/en/dashboard/program/test_suite1');

    await page.getByRole('button', { name: /withdraw/i }).click();

    // Confirm within the custom dialog
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^withdraw$/i }).click();

    await expect(page).toHaveURL('en/dashboard');

    // Withdrawn program should no longer appear on the dashboard
    await expect(page.getByText('No studies yet')).toBeVisible();

    // Verify in DB
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_programId: {
          userId: sharedUserId,
          programId: 'test_suite1',
        },
      },
    });
    expect(enrollment).toBeNull();
  });

  test('Withdrawing when not enrolled does not throw', async ({ page }) => {
    const response = await page.request.delete(`/api/dashboard/programs/test_suite1/enrollment`);

    // Should return 200, not 404 or 500
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.enrolled).toBe(false);
  });
});
