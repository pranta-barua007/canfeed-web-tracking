import { test, expect } from '@playwright/test';

test.describe('Comments Flow', () => {
    test('should load the dashboard and show URL input', async ({ page }) => {
        // Navigate to the dashboard
        await page.goto('/');

        // Check if the logo or title is present
        // The page title might be "CanFeed" but let's check for the header or input
        await expect(page.locator('input[placeholder="https://example.com"]')).toBeVisible();
    });

    test('should navigate to a workspace and see the sidebar', async ({ page }) => {
        // This assumes there's at least one workspace. 
        // In a real E2E environment, we would seed the database first.
        await page.goto('/workspace?url=https://example.com');

        // Check if the comments sidebar is visible
        // Use a more specific locator to avoid strict mode violation
        const sidebarHeader = page.locator('span:has-text("Comments (")');
        await expect(sidebarHeader).toBeVisible();
    });
});
