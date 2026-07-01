import type { BrowserContext, Page } from '@playwright/test';

export async function addSessionCookie(context: BrowserContext, sessionToken: string) {
  await context.addCookies([
    {
      name: 'authjs.session-token',
      value: sessionToken,
      domain: 'web',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

export function getDivByHeading(page: Page, heading: string | RegExp) {
  return page
    .locator('div')
    .filter({
      has: page.getByRole('heading', { name: heading }),
    })
    .last();
}

export function getTask(page: Page, task: string | RegExp) {
  const taskList = getDivByHeading(page, /available tasks/i);
  return taskList.getByRole('button', { name: task });
}
