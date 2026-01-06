import { test, expect } from '@playwright/test';

test.describe('Comments Flow', () => {
    test('should load the dashboard and show workspace list', async ({ page }) => {
        // Navigate to the dashboard
        await page.goto('/');

        // Check if the logo or title is present
        await expect(page).toHaveTitle(/CanFeed/i);

        // Wait for the main content to load
        const workspaceList = page.locator('text=Recent Workspaces');
        await expect(workspaceList).toBeVisible();
    });

    test('should navigate to a workspace and see the sidebar', async ({ page }) => {
        // This assumes there's at least one workspace. 
        // In a real E2E environment, we would seed the database first.
        await page.goto('/workspace?url=https://example.com');

        // Check if the comments sidebar is visible
        const sidebar = page.locator('text=Comments');
        await expect(sidebar).toBeVisible();
    });
});
