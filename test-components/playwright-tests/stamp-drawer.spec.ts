import { test, expect, Page } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to load the test component
async function loadStampDrawer(page: Page) {
  const htmlPath = join(__dirname, "..", "stamp-drawer-unified.html");
  await page.goto(`file://${htmlPath}`);
  await page.waitForLoadState("networkidle");
}

// Helper to set viewport and wait for render
async function setViewportSize(page: Page, viewportOption: string) {
  const select = page.locator('[aria-label="Viewport Size"]');
  await select.selectOption(viewportOption);
  await page.waitForTimeout(300); // Wait for animation
}

// Helper to set scenario
async function setScenario(page: Page, scenario: string) {
  const select = page.locator('[aria-label="Scenario"]');
  await select.selectOption(scenario);
  await page.waitForTimeout(300); // Wait for re-render
}

test.describe("Stamp Drawer - Layout Issues", () => {
  test.beforeEach(async ({ page }) => {
    await loadStampDrawer(page);
  });

  test("3-column layout for guided flow should have 2 stamp cols + 1 steps col", async ({ page }) => {
    // Set up Clean Hands (guided flow) in wide desktop view
    await setScenario(page, "clean-hands");
    await setViewportSize(page, "desktop-wide");

    // Check that we have a 3-column layout
    const mainContainer = page.locator(".drawer-desktop-wide .flex-1.overflow-hidden.flex");
    await expect(mainContainer).toBeVisible();

    // The stamps section should take 2/3 of the width
    const stampsSection = mainContainer.locator("> div").first();
    const stampsWidth = await stampsSection.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.width;
    });

    // The steps section should take 1/3 of the width
    const stepsSection = mainContainer.locator("> div").nth(1); // Second child (no divider in current implementation)
    const stepsWidth = await stepsSection.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return computed.width;
    });

    // Log current widths for debugging
    console.log("Stamps width:", stampsWidth, "Steps width:", stepsWidth);

    // Take screenshot for visual verification
    await page.screenshot({
      path: "test-results/3-column-layout-issue.png",
      fullPage: true,
    });

    // Visual test: stamps should have space for 2 columns
    const stampCards = stampsSection.locator(".grid .credential-card");
    const stampCount = await stampCards.count();
    expect(stampCount).toBeGreaterThan(0);

    // Check if stamps are arranged in a 2-column grid when steps are visible
    const stampGrid = stampsSection.locator(".grid");
    const gridClasses = await stampGrid.getAttribute("class");
    expect(gridClasses).toContain("grid-cols-2"); // Should be 2 columns for stamps when steps take the 3rd column
  });

  test("stamps should only take up one row and one column each", async ({ page }) => {
    // Use Ethereum (multi-credential) view
    await setScenario(page, "ethereum-verified");
    await setViewportSize(page, "desktop-wide");

    // Find all credential cards
    const credentialCards = page.locator(".credential-card");
    const cardCount = await credentialCards.count();

    // Check each card's size relative to grid
    for (let i = 0; i < cardCount; i++) {
      const card = credentialCards.nth(i);
      const cardBox = await card.boundingBox();

      // Get the grid container
      const grid = await card.locator('xpath=ancestor::div[contains(@class, "grid")]').first();
      const gridBox = await grid.boundingBox();

      if (cardBox && gridBox) {
        // In a 3-column grid, each card should be ~33% width
        const cardWidthRatio = cardBox.width / gridBox.width;
        console.log(`Card ${i} width ratio: ${cardWidthRatio}`);

        // Cards should not span multiple columns
        expect(cardWidthRatio).toBeLessThanOrEqual(0.34); // Allow slight margin
      }
    }

    await page.screenshot({
      path: "test-results/stamp-grid-constraints.png",
      fullPage: true,
    });
  });

  test("title section should be within stamp columns, not over steps", async ({ page }) => {
    await setScenario(page, "clean-hands");
    await setViewportSize(page, "desktop-wide");

    // In the desktop layout, the header is inside the stamps column
    const stampsColumn = page.locator(".flex-1.overflow-hidden.flex > div").first();
    const header = stampsColumn.locator("div").first(); // Header is first child of stamps column
    const headerBox = await header.boundingBox();

    // Find the steps section (second child of flex container)
    const stepsSection = page.locator(".flex-1.overflow-hidden.flex > div").nth(1);
    const stepsBox = await stepsSection.boundingBox();

    if (headerBox && stepsBox) {
      console.log("Header right edge:", headerBox.x + headerBox.width);
      console.log("Steps left edge:", stepsBox.x);

      // Header should not extend over the steps column
      expect(headerBox.x + headerBox.width).toBeLessThanOrEqual(stepsBox.x);
    }

    await page.screenshot({
      path: "test-results/title-positioning.png",
      fullPage: true,
    });
  });

  test("mobile layout should show steps before stamps", async ({ page }) => {
    await setScenario(page, "clean-hands");
    await setViewportSize(page, "mobile");

    // Find the scrollable body
    const body = page.locator(".drawer-container .flex-1.overflow-y-auto");

    // Get all major sections in order
    const sections = await body.locator("> *").all();
    let foundStamps = false;
    let foundSteps = false;
    let stepsIndex = -1;
    let stampsIndex = -1;

    for (let i = 0; i < sections.length; i++) {
      const text = await sections[i].textContent();
      if (text?.includes("Step by step Guide")) {
        foundSteps = true;
        stepsIndex = i;
      }
      if (text?.includes("Stamps")) {
        foundStamps = true;
        stampsIndex = i;
      }
    }

    console.log("Steps index:", stepsIndex, "Stamps index:", stampsIndex);

    // Steps should come before stamps
    if (foundSteps && foundStamps) {
      expect(stepsIndex).toBeLessThan(stampsIndex);
    }

    await page.screenshot({
      path: "test-results/mobile-layout-order.png",
      fullPage: true,
    });
  });
});

test.describe("Stamp Drawer - Visual Regression Tests", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 800 },
    { name: "desktop-wide", width: 1920, height: 1080 },
  ];

  const scenarios = ["ethereum-not-verified", "ethereum-verified", "clean-hands", "clean-hands-verified"];

  for (const viewport of viewports) {
    for (const scenario of scenarios) {
      test(`${scenario} @ ${viewport.name}`, async ({ page }) => {
        // Set viewport first
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Load component
        await loadStampDrawer(page);

        // Set scenario
        await setScenario(page, scenario);

        // Wait for render
        await page.waitForTimeout(500);

        // Take screenshot
        await page.screenshot({
          path: `test-results/visual/${scenario}-${viewport.name}.png`,
          fullPage: true,
        });

        // Could add visual comparison here with expect(screenshot).toMatchSnapshot()
      });
    }
  }
});

test.describe("Stamp Drawer - Interaction Tests", () => {
  test("verify button should trigger verification flow", async ({ page }) => {
    await loadStampDrawer(page);
    await setScenario(page, "ethereum-not-verified");

    // Listen for dialog
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Verify button clicked");
      await dialog.accept();
    });

    // Click verify
    await page.locator('button:has-text("Verify")').click();
  });

  test("close button should be in correct position", async ({ page }) => {
    await loadStampDrawer(page);

    // Desktop view - close button should be in header
    await setViewportSize(page, "desktop");
    const desktopClose = page.locator('[aria-label="Close drawer"]');
    await expect(desktopClose).toBeVisible();

    // For guided flow with columns, close should be in stamp section
    await setScenario(page, "clean-hands");
    await setViewportSize(page, "desktop-wide");

    // TODO: Verify close button is in the stamp column header, not the main header
  });
});

test.describe("Stamp Drawer - Scrolling Behavior", () => {
  test("guided flow: entire stamp column should scroll together", async ({ page }) => {
    await loadStampDrawer(page);
    await setScenario(page, "clean-hands");
    await setViewportSize(page, "desktop-wide");

    // Find the stamp column container
    const stampColumn = page.locator(".flex-1.overflow-hidden.flex > div").first();

    // Check that title/description/points module are NOT in a fixed header
    const titleSection = stampColumn.locator(".px-8.py-6.border-b");
    const contentSection = stampColumn.locator(".p-8.pb-0");

    // These should be within the scrollable area, not fixed
    const scrollableArea = stampColumn.locator(".overflow-y-auto");

    // Content section with points/description should be in scrollable area
    await expect(contentSection).toHaveCount(0); // Should not exist as separate fixed section

    // All content should be in the scrollable container
    const scrollableContent = await scrollableArea.locator("*").first();
    await expect(scrollableContent).toBeVisible();
  });

  test("multi-credential view: title/description should scroll with content", async ({ page }) => {
    await loadStampDrawer(page);
    await setScenario(page, "ethereum-verified");
    await setViewportSize(page, "desktop-wide");

    // In multi-credential view, the header should be fixed but content scrolls
    const drawer = page.locator(".drawer-container");
    const header = drawer.locator("> div").first();
    const scrollableBody = drawer.locator(".overflow-y-auto");

    // Header with title should be fixed
    await expect(header).toHaveClass(/border-b/);

    // Description and other content should be in scrollable area
    const description = page.locator("text=Passport analyzes your transaction history");
    const descriptionParent = await description.locator("..").first();

    // Check if description is in the scrollable area (not in the fixed header)
    const isInHeader = (await header.locator("text=Passport analyzes your transaction history").count()) > 0;
    const isInScrollable = (await scrollableBody.locator("text=Passport analyzes your transaction history").count()) > 0;
    
    expect(isInHeader).toBe(false); // Description should NOT be in header
    expect(isInScrollable).toBe(true); // Description should be in scrollable body
  });

  test("steps column should have its own scroll", async ({ page }) => {
    await loadStampDrawer(page);
    await setScenario(page, "clean-hands");
    await setViewportSize(page, "desktop-wide");

    // Find the steps column
    const stepsColumn = page.locator(".flex-1.overflow-hidden.flex > div").nth(1);

    // The scrollable area is a child of the steps column
    const scrollableSteps = stepsColumn.locator(".overflow-y-auto");
    await expect(scrollableSteps).toBeVisible();
    await expect(scrollableSteps).toHaveClass(/overflow-y-auto/);

    // Steps header should be visible
    const stepGuide = stepsColumn.locator("text=Step by step Guide");
    await expect(stepGuide).toBeVisible();
  });

  test("steps column should remain visible when stamp is verified", async ({ page }) => {
    await loadStampDrawer(page);
    await setScenario(page, "clean-hands-verified");
    await setViewportSize(page, "desktop-wide");

    // Find the main flex container
    const mainContainer = page.locator(".flex-1.overflow-hidden.flex");

    // Should have two children (stamps column and steps column) even when verified
    const childDivs = mainContainer.locator("> div");
    const childCount = await childDivs.count();

    // When verified, should still show both columns
    expect(childCount).toBe(2);

    // Stamps column should NOT take full width
    const stampsColumn = childDivs.first();
    await expect(stampsColumn).toHaveClass(/w-2\/3/);

    // Steps column should still be visible
    const stepsColumn = childDivs.nth(1);
    await expect(stepsColumn).toHaveClass(/w-1\/3/);

    // Ensure "Step by step Guide" text is still visible
    const stepGuideText = page.locator("text=Step by step Guide");
    await expect(stepGuideText).toBeVisible();
  });

  test("steps should remain visible in medium desktop when verified", async ({ page }) => {
    await loadStampDrawer(page);
    await setScenario(page, "clean-hands-verified");
    await setViewportSize(page, "desktop");

    // In medium desktop, steps should still be visible
    const mainContainer = page.locator(".flex-1.overflow-hidden.flex");
    const childDivs = mainContainer.locator("> div");
    const childCount = await childDivs.count();

    // Should have two columns
    expect(childCount).toBe(2);

    // Both columns should be half width
    const stampsColumn = childDivs.first();
    await expect(stampsColumn).toHaveClass(/w-1\/2/);

    const stepsColumn = childDivs.nth(1);
    await expect(stepsColumn).toHaveClass(/w-1\/2/);

    // Ensure "Step by step Guide" text is still visible
    const stepGuideText = page.locator("text=Step by step Guide");
    await expect(stepGuideText).toBeVisible();
  });
});
