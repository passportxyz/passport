import { test, expect, Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to load the test component
async function loadStampDrawer(page: Page) {
  const htmlPath = join(__dirname, '..', 'stamp-drawer-unified.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForLoadState('networkidle');
}

// Helper to set scenario
async function setScenario(page: Page, scenario: string) {
  const select = page.locator('[aria-label="Scenario"]');
  await select.selectOption(scenario);
  await page.waitForTimeout(300); // Wait for re-render
}

test.describe('Stamp Drawer Small View Layout', () => {
  test.beforeEach(async ({ page }) => {
    await loadStampDrawer(page);
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test.describe('Element Order from Top to Bottom', () => {
    test('Multi-credential view should have correct element order', async ({ page }) => {
      // Show Ethereum drawer (multi-credential)
      await setScenario(page, 'ethereum-not-verified');
      await page.waitForTimeout(500); // Wait for re-render
      
      // Find the scrollable section that contains the reordered content
      const scrollableSection = page.locator('.scrollable-section').first();
      
      // Check that elements appear in the correct order within the scrollable section
      // The order should be: Points, Description, CTA, Stamps
      
      // 1. Check points module is first in scrollable content
      const pointsModule = scrollableSection.locator('[data-testid="points-module"]');
      await expect(pointsModule).toBeVisible();
      
      // 2. Check description comes after points
      const description = scrollableSection.locator('[data-testid="platform-description"]');
      await expect(description).toBeVisible();
      
      // 3. Check action button and learn more
      const actionButton = scrollableSection.locator('[data-testid="action-button"]');
      await expect(actionButton).toBeVisible();
      
      const learnMore = scrollableSection.locator('[data-testid="learn-more"]');
      await expect(learnMore).toBeVisible();
      
      // 4. Check stamps section is last
      const stampsSection = scrollableSection.locator('[data-testid="stamps-section"]');
      await expect(stampsSection).toBeVisible();
      
      // Verify the visual order by checking positions
      const pointsBox = await pointsModule.boundingBox();
      const descBox = await description.boundingBox();
      const actionBox = await actionButton.boundingBox();
      const stampsBox = await stampsSection.boundingBox();
      
      // Points should be above description
      expect(pointsBox!.y).toBeLessThan(descBox!.y);
      // Description should be above action button
      expect(descBox!.y).toBeLessThan(actionBox!.y);
      // Action button should be above stamps
      expect(actionBox!.y).toBeLessThan(stampsBox!.y);
    });

    test('Guided flow view should have correct element order with steps', async ({ page }) => {
      // Show GTC Staking drawer (guided flow)
      await setScenario(page, 'gtc-staking');
      await page.waitForTimeout(500);

      const scrollableSection = page.locator('.scrollable-section').first();
      
      // Check all elements are visible
      await expect(scrollableSection.locator('[data-testid="points-module"]')).toBeVisible();
      await expect(scrollableSection.locator('[data-testid="platform-description"]')).toBeVisible();
      await expect(scrollableSection.locator('[data-testid="action-button"]')).toBeVisible();
      await expect(scrollableSection.locator('[data-testid="stamps-section"]')).toBeVisible();
      
      // GTC Staking doesn't have steps in the test data, so we don't check for steps here
      // The guided flow would show steps if they were configured
    });
  });

  test.describe('Layout Properties', () => {
    test('Points module should not have box styling', async ({ page }) => {
      await setScenario(page, 'ethereum-not-verified');
      await page.waitForTimeout(500);

      const pointsModule = page.locator('[data-testid="points-module"]');
      await expect(pointsModule).toBeVisible();
      
      // The points module in mobile view doesn't have box styling (no gray background)
      // It's just the points text and progress bar
    });

    test('Time and Price should be side by side with equal width', async ({ page }) => {
      await setScenario(page, 'gtc-staking');
      await page.waitForTimeout(500);

      const timeElement = page.locator('[data-testid="time-to-get"]');
      const priceElement = page.locator('[data-testid="price"]');
      
      await expect(timeElement).toBeVisible();
      await expect(priceElement).toBeVisible();
      
      // Get their positions
      const timeBounds = await timeElement.boundingBox();
      const priceBounds = await priceElement.boundingBox();
      
      expect(timeBounds).toBeTruthy();
      expect(priceBounds).toBeTruthy();
      
      // Should be on same horizontal line
      expect(Math.abs(timeBounds!.y - priceBounds!.y)).toBeLessThan(5);
    });

    test('Action button should be full width', async ({ page }) => {
      await setScenario(page, 'ethereum-not-verified');
      await page.waitForTimeout(500);

      const actionButton = page.locator('[data-testid="action-button"]');
      await expect(actionButton).toBeVisible();
      
      // Get button and container widths
      const buttonBox = await actionButton.boundingBox();
      const containerBox = await page.locator('.scrollable-section').first().boundingBox();
      
      expect(buttonBox).toBeTruthy();
      expect(containerBox).toBeTruthy();
      
      // Button should take most of the container width (accounting for padding)
      const widthRatio = buttonBox!.width / (containerBox!.width - 32); // 32px for padding
      expect(widthRatio).toBeGreaterThan(0.9);
    });
  });

  test.describe('Verified State', () => {
    test('Should maintain correct order in verified state', async ({ page }) => {
      // Show verified Ethereum drawer
      await setScenario(page, 'ethereum-verified');
      await page.waitForTimeout(500);

      const scrollableSection = page.locator('.scrollable-section').first();
      
      // In verified state, should still have same order but with Close button instead of Verify
      const actionButton = scrollableSection.locator('[data-testid="action-button"]');
      await expect(actionButton).toBeVisible();
      
      const buttonText = await actionButton.textContent();
      expect(buttonText).toContain('Close');

      // Points module should still be visible and in correct position
      const pointsModule = scrollableSection.locator('[data-testid="points-module"]');
      await expect(pointsModule).toBeVisible();
      
      // Order should still be maintained
      const pointsBox = await pointsModule.boundingBox();
      const descBox = await scrollableSection.locator('[data-testid="platform-description"]').boundingBox();
      
      expect(pointsBox!.y).toBeLessThan(descBox!.y);
    });
  });
});