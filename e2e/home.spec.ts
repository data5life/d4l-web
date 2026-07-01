/**
 * E2E Test: Home Page and Navigation
 * Smoke tests to verify routing works correctly for unauthenticated users
 */

import { test, expect } from '@playwright/test';

test.describe('Unauthenticated User', () => {
  test('should redirect to login when visiting dashboard', async ({ page }) => {
    await page.goto('/en/dashboard');

    // Dashboard is protected → should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should stay on login page when visiting /login directly', async ({ page }) => {
    await page.goto('/en/login');

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login Page', () => {
  test('should display Google sign-in button', async ({ page }) => {
    await page.goto('/en/login');

    // Check for Google sign-in button
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should display email sign-in form', async ({ page }) => {
    await page.goto('/en/login');

    // Check for email input field
    const emailInput = page.getByRole('textbox', { name: /email/i });
    await expect(emailInput).toBeVisible();
  });
});
