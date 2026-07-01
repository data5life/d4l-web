import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { addSessionCookie, getDivByHeading, getTask } from './utils/utils';
import { DonorIdentity } from '@d4l/collect-lib';

test.describe('Dashboard for Authenticated User', () => {
  let sharedUserId: string;
  const sessionToken = 'fake-session-token-study-flow';

  test.beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test-study-flow@example.com',
        name: 'Test User Study-Flow',
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
      scope: 'test_suite2',
    };

    await prisma.enrollment.create({
      data: {
        userId: user.id,
        programId: 'test_suite2',
        did,
        subjectId: '000',
      },
    });
  });

  test.afterAll(async () => {
    await prisma.user.delete({ where: { id: sharedUserId } });
  });

  test.beforeEach(async ({ context }) => {
    await addSessionCookie(context, sessionToken);
  });

  test('should redirect to callbackURL when visiting login', async ({ page }) => {
    await page.goto('/en/login?callbackUrl=%2Fen%2Fdashboard%2Fprogram%2Ftest_suite2');
    await page.waitForURL(/\/dashboard\/program\/test_suite2/, { timeout: 100000 });
  });

  test('declining consent popup should not start study', async ({ page }) => {
    await page.goto('/en/dashboard/program/test_suite2');

    const consentButton = getTask(page, /consent/i);
    await consentButton.click();

    const declineButton = page.getByRole('button', { name: /decline/i });
    await expect(declineButton).toBeVisible();
    await declineButton.click();

    const firstQuestionnaire = getTask(page, /first questionnaire/i);
    await expect(firstQuestionnaire).not.toBeAttached();
  });

  test('full study flow: consent, questionnaire, submission', async ({ page }) => {
    await page.goto('/en/dashboard/program/test_suite2');

    // Accept consent
    const consentButton = getTask(page, /consent/i);
    await consentButton.click();

    const acceptButton = page.getByRole('button', { name: /accept/i });
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();

    const firstQuestionnaire = getTask(page, /first questionnaire/i);
    await expect(firstQuestionnaire).toBeVisible();
    await expect(firstQuestionnaire).toBeEnabled();

    // Fill out questionnaire
    await firstQuestionnaire.click();

    const firstQuestion = getDivByHeading(page, /first question/i);
    await expect(firstQuestion).toBeVisible();

    const continueButton = page.getByRole('button', { name: /complete/i });
    await expect(continueButton).toBeVisible();
    await expect(continueButton).toBeDisabled();

    const numberInput = firstQuestion.getByRole('spinbutton');
    await expect(numberInput).toBeEnabled();

    await numberInput.pressSequentially('text');
    await expect(continueButton).toBeDisabled();

    await numberInput.fill('123');
    await expect(continueButton).toBeEnabled();
    await continueButton.click();

    const questionContainer = page
      .locator('div')
      .filter({ has: page.getByText('First question', { exact: true }) })
      .filter({ has: page.getByText('123', { exact: true }) });
    await expect(questionContainer.getByText('123')).toBeVisible();

    const editButton = questionContainer.getByRole('button', { name: /edit/i });
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();

    const submitButton = page.getByRole('button', { name: /submit answers/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page).toHaveURL(/\/dashboard\/program\/test_suite2/);

    // Verify submission appears
    const submissionList = getDivByHeading(page, /my submissions/i);
    const submittedQuestion = submissionList.getByRole('button', { name: /first question/i });
    await expect(submittedQuestion).toBeVisible();
    await expect(submittedQuestion).toBeEnabled();
  });
});
