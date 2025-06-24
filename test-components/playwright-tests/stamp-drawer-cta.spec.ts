import { test, expect } from "@playwright/test";

const testUrl = "file:///Users/lucian/projects/passport/test-components/stamp-drawer-unified.html";

test.describe("Stamp Drawer CTA and Learn More", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrl);
  });

  test.describe("Custom CTA with Learn More", () => {
    test("should have proper spacing between custom CTA and Learn More link", async ({ page }) => {
      // Select GTC Staking scenario which has custom CTA
      await page.getByRole("combobox").first().selectOption(["gtc-staking"]);

      // Wait for drawer to update
      await page.waitForTimeout(500);

      // Check that both elements exist
      const ctaButton = page.locator(".btn-cta").first();
      const learnMoreLink = page.locator(".learn-more").first();

      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toHaveText("Identity Staking");
      await expect(learnMoreLink).toBeVisible();
      await expect(learnMoreLink).toHaveText("Learn More");

      // Get the parent container that holds both
      const buttonContainer = ctaButton.locator(".."); // parent of CTA button

      // Check that the gap is sufficient (gap-3 = 0.75rem = 12px)
      await expect(buttonContainer).toHaveCSS("gap", "12px");

      // Visual regression test for cramped spacing
      await buttonContainer.screenshot({
        path: "test-results/cta-learn-more-spacing.png",
      });
    });

    test("should style Learn More as a subtle link", async ({ page }) => {
      await page.getByRole("combobox").first().selectOption(["gtc-staking"]);

      // Wait for drawer to update
      await page.waitForTimeout(500);

      const learnMoreLink = page.locator(".learn-more").first();

      // Check styling - Learn More is now styled with text-gray-500
      await expect(learnMoreLink).toHaveCSS("font-size", "14px");
      await expect(learnMoreLink).toHaveCSS("color", "rgb(107, 114, 128)"); // text-gray-500

      // Check hover state
      await learnMoreLink.hover();
      await expect(learnMoreLink).toHaveCSS("color", "rgb(55, 65, 81)"); // text-gray-700
    });
  });

  test.describe("Default Verify CTA", () => {
    test("should show Verify button when no custom CTA is defined", async ({ page }) => {
      // Select Ethereum scenario which has no custom CTA
      await page.getByRole("combobox").first().selectOption(["ethereum-not-verified"]);

      // Wait for drawer to update
      await page.waitForTimeout(500);

      const verifyButton = page.locator(".btn-verify").first();
      const learnMoreLink = page.locator(".learn-more").first();

      await expect(verifyButton).toBeVisible();
      await expect(verifyButton).toHaveText("Verify");
      await expect(learnMoreLink).toBeVisible();
    });

    test("should maintain consistent spacing with default Verify button", async ({ page }) => {
      await page.getByRole("combobox").first().selectOption(["ethereum-not-verified"]);

      // Wait for drawer to update
      await page.waitForTimeout(500);

      // Get the parent container by finding the verify button first
      const verifyButton = page.locator(".btn-verify").first();
      const buttonContainer = verifyButton.locator("..");

      await expect(buttonContainer).toHaveCSS("gap", "12px");
    });
  });

  test.describe("Mobile Layout", () => {
    test("should stack buttons properly on mobile", async ({ page }) => {
      // Switch to mobile viewport
      await page.getByRole("combobox").nth(1).selectOption(["mobile"]);
      await page.getByRole("combobox").first().selectOption(["gtc-staking"]);

      // Wait for drawer to update
      await page.waitForTimeout(500);

      const ctaButton = page.locator(".btn-cta").first();
      const buttonContainer = ctaButton.locator("..");

      // Should still be flex with gap on mobile
      await expect(buttonContainer).toHaveCSS("display", "flex");
      await expect(buttonContainer).toHaveCSS("gap", "12px");

      // Visual test for mobile layout
      await buttonContainer.screenshot({
        path: "test-results/mobile-cta-learn-more.png",
      });
    });
  });

  test.describe("Learn More Link Improvements", () => {
    test("should have better visual hierarchy for Learn More", async ({ page }) => {
      await page.getByRole("combobox").first().selectOption(["gtc-staking"]);

      // Wait for drawer to update
      await page.waitForTimeout(500);

      const learnMoreLink = page.locator(".learn-more").first();

      // Should have proper margin from CTA button (mt-3 = 0.75rem = 12px)
      await expect(learnMoreLink).toHaveCSS("margin-top", "12px");

      // Should have smaller, less prominent styling
      await expect(learnMoreLink).toHaveCSS("font-size", "14px");

      // Should have icon
      const icon = learnMoreLink.locator("svg");
      await expect(icon).toBeVisible();
      await expect(icon).toHaveCSS("width", "16px");
      await expect(icon).toHaveCSS("height", "16px");
    });
  });
});
