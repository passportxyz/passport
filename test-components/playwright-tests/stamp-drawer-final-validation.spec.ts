import { test, expect } from "@playwright/test";

const testUrl = "file:///Users/lucian/projects/passport/test-components/stamp-drawer-unified.html";

test.describe("Stamp Drawer Final Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(testUrl);
  });

  test.describe("CTA and Learn More Implementation", () => {
    test("MultiCredentialView - Custom CTA with Learn More", async ({ page }) => {
      // Select GTC Staking which has custom CTA
      await page.getByRole("combobox").first().selectOption(["gtc-staking"]);
      await page.waitForTimeout(500);

      // Verify custom CTA button
      const ctaButton = page.locator(".btn-cta").first();
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toHaveText("Identity Staking");

      // Verify Learn More is on separate line
      const learnMore = page.locator(".learn-more").first();
      await expect(learnMore).toBeVisible();
      await expect(learnMore).toHaveCSS("display", "block");
      await expect(learnMore).toHaveCSS("margin-top", "12px");

      // Take screenshot for visual validation
      await page.locator("div").filter({ hasText: "Identity StakingLearn More" }).first().screenshot({
        path: "test-results/final-gtc-staking-cta.png",
      });
    });

    test("MultiCredentialView - Default Verify with Learn More", async ({ page }) => {
      // Select Ethereum which has no custom CTA
      await page.getByRole("combobox").first().selectOption(["ethereum-not-verified"]);
      await page.waitForTimeout(500);

      // Verify default Verify button
      const verifyButton = page.locator(".btn-verify").first();
      await expect(verifyButton).toBeVisible();
      await expect(verifyButton).toHaveText("Verify");

      // Verify Learn More is on separate line
      const learnMore = page.locator(".learn-more").first();
      await expect(learnMore).toBeVisible();
      await expect(learnMore).toHaveCSS("display", "block");

      // Take screenshot
      await page.locator("div").filter({ hasText: "VerifyLearn More" }).first().screenshot({
        path: "test-results/final-ethereum-verify.png",
      });
    });

    test("GuidedFlowView - Default Verify with Learn More", async ({ page }) => {
      // Select Clean Hands which uses GuidedFlowView
      await page.getByRole("combobox").first().selectOption(["clean-hands"]);
      await page.waitForTimeout(500);

      // Verify Verify button exists in guided flow
      const verifyButton = page.locator(".btn-verify").first();
      await expect(verifyButton).toBeVisible();
      await expect(verifyButton).toHaveText("Verify");

      // Verify Learn More exists
      const learnMore = page.locator(".learn-more").first();
      await expect(learnMore).toBeVisible();

      // Take screenshot of desktop view
      await page.locator("div").filter({ hasText: "VerifyLearn More" }).first().screenshot({
        path: "test-results/final-clean-hands-desktop.png",
      });
    });

    test("Mobile Layout - All Views", async ({ page }) => {
      // Switch to mobile
      await page.getByRole("combobox").nth(1).selectOption(["mobile"]);

      // Test GTC Staking (custom CTA)
      await page.getByRole("combobox").first().selectOption(["gtc-staking"]);
      await page.waitForTimeout(500);

      const gtcCta = page.locator(".btn-cta").first();
      const gtcLearnMore = page.locator(".learn-more").first();
      await expect(gtcCta).toBeVisible();
      await expect(gtcLearnMore).toBeVisible();

      await page.locator("div").filter({ hasText: "Identity StakingLearn More" }).first().screenshot({
        path: "test-results/final-mobile-gtc.png",
      });

      // Test Clean Hands (guided flow)
      await page.getByRole("combobox").first().selectOption(["clean-hands"]);
      await page.waitForTimeout(500);

      const cleanVerify = page.locator(".btn-verify").first();
      const cleanLearnMore = page.locator(".learn-more").first();
      await expect(cleanVerify).toBeVisible();
      await expect(cleanLearnMore).toBeVisible();

      await page.locator("div").filter({ hasText: "VerifyLearn More" }).first().screenshot({
        path: "test-results/final-mobile-clean-hands.png",
      });
    });
  });

  test.describe("Learn More Styling", () => {
    test("should have consistent styling across all views", async ({ page }) => {
      await page.getByRole("combobox").first().selectOption(["gtc-staking"]);
      await page.waitForTimeout(500);

      const learnMore = page.locator(".learn-more").first();

      // Check base styles
      await expect(learnMore).toHaveCSS("font-size", "14px");
      await expect(learnMore).toHaveCSS("color", "rgb(107, 114, 128)"); // text-gray-500
      // transition-colors class applies multiple properties, just check that it includes color
      const transitionProperty = await learnMore.evaluate((el) => window.getComputedStyle(el).transitionProperty);
      expect(transitionProperty).toContain("color");

      // Check icon
      const icon = learnMore.locator("svg");
      await expect(icon).toBeVisible();
      await expect(icon).toHaveCSS("width", "16px");
      await expect(icon).toHaveCSS("display", "inline");

      // Check hover state
      await learnMore.hover();
      await expect(learnMore).toHaveCSS("color", "rgb(55, 65, 81)"); // text-gray-700
    });
  });

  test.describe("Verified State", () => {
    test("should show Close button when verified", async ({ page }) => {
      await page.getByRole("combobox").first().selectOption(["ethereum-verified"]);
      await page.waitForTimeout(500);

      // Should show Close button instead of Verify
      const closeButton = page.locator(".btn-verify").first();
      await expect(closeButton).toBeVisible();
      await expect(closeButton).toHaveText("Close");

      // Learn More should still be visible
      const learnMore = page.locator(".learn-more").first();
      await expect(learnMore).toBeVisible();
    });
  });
});
