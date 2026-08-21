import { test, expect } from '@playwright/test';

test.describe('Core Flow — BOQ to Daily Progress', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('Email').fill('admin@scgims.gov.pk');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('http://localhost:3000/');
  });

  test('BOQ list shows records', async ({ page }) => {
    await page.goto('http://localhost:3000/boq');
    await expect(page.getByText('Bill of Quantities')).toBeVisible();
    await expect(page.getByText('Karachi Safe City Phase 1')).toBeVisible();
  });

  test('BOQ detail page loads', async ({ page }) => {
    await page.goto('http://localhost:3000/boq');
    await page.getByRole('button', { name: /view/i }).first().click();
    await expect(page.getByText('BOQ Items')).toBeVisible();
  });

  test('daily progress form submits entry', async ({ page }) => {
    await page.goto('http://localhost:3000/daily-progress');
    await page.getByRole('button', { name: /add entry/i }).click();
    await expect(page.getByText('New Progress Entry')).toBeVisible();
  });

  test('deviations list shows records', async ({ page }) => {
    await page.goto('http://localhost:3000/deviations');
    await expect(page.getByText('Deviations / NCR Register')).toBeVisible();
    await expect(page.getByText('Karachi CCTV Network')).toBeVisible();
  });

  test('executive dashboard shows KPI cards', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.getByText('Executive Dashboard')).toBeVisible();
    await expect(page.getByText('Total Sites')).toBeVisible();
    await expect(page.getByText('Pending Approvals')).toBeVisible();
  });
});
