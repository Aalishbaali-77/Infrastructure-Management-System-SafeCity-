import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('admin@scgims.gov.pk');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('http://localhost:3000/');
  });

  test('sidebar navigates to Projects', async ({ page }) => {
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL('http://localhost:3000/projects');
    await expect(page.getByText('Projects')).toBeVisible();
  });

  test('sidebar navigates to BOQ', async ({ page }) => {
    await page.getByRole('link', { name: 'BOQ' }).click();
    await expect(page).toHaveURL('http://localhost:3000/boq');
    await expect(page.getByText('Bill of Quantities')).toBeVisible();
  });

  test('sidebar navigates to Daily Progress', async ({ page }) => {
    await page.getByRole('link', { name: 'Daily Progress' }).click();
    await expect(page).toHaveURL('http://localhost:3000/daily-progress');
    await expect(page.getByText('Daily Progress')).toBeVisible();
  });

  test('breadcrumbs show correct path', async ({ page }) => {
    await page.getByRole('link', { name: 'Projects' }).click();
    await expect(page.getByText('Home')).toBeVisible();
    await expect(page.getByText('Projects')).toBeVisible();
  });
});
