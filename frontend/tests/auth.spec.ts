import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await expect(page.getByText('SC-GIMS')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('login with valid credentials navigates to dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('admin@scgims.gov.pk');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByText('Executive Dashboard')).toBeVisible();
  });

  test('login with empty fields shows validation errors', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('http://localhost:3000/projects');
    await expect(page).toHaveURL('http://localhost:3000/login');
  });
});
