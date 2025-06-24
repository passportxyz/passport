import { test, expect } from "@playwright/test";

test.describe("Stamp Drawer Multi-Column Layout Requirements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("file:///Users/lucian/projects/passport/test-components/stamp-drawer-unified.html");
  });

  test("Desktop Wide: Description/CTA should be left of points box in horizontal layout", async ({ page }) => {
    // Set to desktop wide and GTC staking
    await page.locator("select").nth(1).selectOption("desktop-wide");
    await page.locator("select").first().selectOption("gtc-staking");
    await page.waitForTimeout(300);

    // Find the main content section (contains description and points)
    const mainContent = page.locator(".drawer-container .overflow-y-auto > div").first();

    // Check that we have the expected elements
    const description = mainContent.locator('p:has-text("Stake GTC to boost")');
    // Look for the points wrapper div with the constrained width class
    const pointsBox = mainContent.locator('.flex-shrink-0.w-80').first();

    await expect(description).toBeVisible();
    await expect(pointsBox).toBeVisible();

    // Get their positions
    const descBounds = await description.boundingBox();
    const pointsBounds = await pointsBox.boundingBox();

    // On desktop, points should be to the right of description
    // Currently they're stacked vertically, so this should fail
    expect(pointsBounds.x).toBeGreaterThan(descBounds.x + descBounds.width - 50);
  });

  test("Desktop Wide: Points box should have constrained width (1 column)", async ({ page }) => {
    await page.locator("select").nth(1).selectOption("desktop-wide");
    await page.locator("select").first().selectOption("gtc-staking");
    await page.waitForTimeout(300);

    // Get the wrapper div that has constrained width
    const pointsBoxWrapper = page.locator(".flex-shrink-0.w-80").first();

    // Check that the element exists and has the width constraint class
    await expect(pointsBoxWrapper).toBeVisible();
    await expect(pointsBoxWrapper).toHaveClass(/w-80/);

    // w-80 in Tailwind is 20rem = 320px
    const bounds = await pointsBoxWrapper.boundingBox();
    expect(bounds.width).toBeLessThanOrEqual(350); // Allow for padding
  });

  test("Mobile: Should stack vertically", async ({ page }) => {
    await page.locator("select").nth(1).selectOption("mobile");
    await page.locator("select").first().selectOption("gtc-staking");
    await page.waitForTimeout(300);

    // Look at the stamp section specifically
    const stampSection = page.locator('[data-testid="stamp-section"]');
    
    // Check that it's in stacked mode
    await expect(stampSection).toHaveAttribute('data-should-stack', 'true');
    
    // In mobile view, elements are stacked vertically as direct children
    // Check that points module is visible and first
    const pointsModule = stampSection.locator('[data-testid="points-module"]');
    await expect(pointsModule).toBeVisible();
    
    // Verify the description is visible
    const description = stampSection.locator('p:has-text("Stake GTC to boost")');
    await expect(description).toBeVisible();
  });

  test("Verified state should maintain same layout structure", async ({ page }) => {
    await page.locator("select").nth(1).selectOption("desktop-wide");
    await page.locator("select").first().selectOption("gtc-staking-verified");
    await page.waitForTimeout(300);

    const mainContent = page.locator(".drawer-container .overflow-y-auto > div").first();
    const description = mainContent.locator('p:has-text("Stake GTC to boost")');
    // Use the same selector as the first test
    const pointsBox = mainContent.locator('.flex-shrink-0.w-80').first();

    await expect(description).toBeVisible();
    await expect(pointsBox).toBeVisible();

    const descBounds = await description.boundingBox();
    const pointsBounds = await pointsBox.boundingBox();

    // Should still be side-by-side on desktop
    expect(pointsBounds.x).toBeGreaterThan(descBounds.x + descBounds.width - 50);
  });
});
