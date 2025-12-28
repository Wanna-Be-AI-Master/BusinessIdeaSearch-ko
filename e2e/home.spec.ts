import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test('페이지가 정상적으로 로드되어야 함', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Create Next App/);
  });

  test('메인 컨텐츠가 표시되어야 함', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });
});
