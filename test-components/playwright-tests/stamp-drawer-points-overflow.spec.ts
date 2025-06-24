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

test.describe("Stamp Drawer - Points Overflow Fix", () => {
  test.beforeEach(async ({ page }) => {
    await loadStampDrawer(page);
  });

  test("points text should not overflow card boundaries", async ({ page }) => {
    // Test with different scenarios that have points
    const scenarios = ["ethereum-verified", "gtc-staking-verified", "clean-hands-verified"];
    const viewports = ["mobile", "desktop", "desktop-wide"];

    for (const scenario of scenarios) {
      for (const viewport of viewports) {
        await setScenario(page, scenario);
        await setViewportSize(page, viewport);

        // Find all credential cards
        const credentialCards = page.locator(".credential-card");
        const cardCount = await credentialCards.count();

        for (let i = 0; i < cardCount; i++) {
          const card = credentialCards.nth(i);
          const cardBox = await card.boundingBox();

          // Find the points badge within the card
          const pointsBadge = card.locator(".points-badge");
          if (await pointsBadge.count() > 0) {
            const pointsBox = await pointsBadge.boundingBox();

            if (cardBox && pointsBox) {
              // Points badge should not extend beyond card boundaries
              expect(pointsBox.x + pointsBox.width).toBeLessThanOrEqual(
                cardBox.x + cardBox.width,
                `Points overflow detected in ${scenario} at ${viewport} viewport for card ${i}`
              );

              // Log for debugging
              console.log(`${scenario}/${viewport}/card-${i}: Card right edge: ${cardBox.x + cardBox.width}, Points right edge: ${pointsBox.x + pointsBox.width}`);
            }
          }
        }
      }
    }
  });

  test("card title and points should use proper flexbox constraints", async ({ page }) => {
    await setScenario(page, "ethereum-verified");
    await setViewportSize(page, "desktop");

    const credentialCards = page.locator(".credential-card");
    const firstCard = credentialCards.first();

    // Check the main flex container
    const flexContainer = firstCard.locator(".flex.items-start.justify-between");
    await expect(flexContainer).toBeVisible();

    // Check flex styles
    const flexStyles = await flexContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        justifyContent: computed.justifyContent,
        alignItems: computed.alignItems,
        gap: computed.gap,
      };
    });

    expect(flexStyles.display).toBe("flex");
    expect(flexStyles.justifyContent).toBe("space-between");

    // Check title container has flex-1
    const titleContainer = flexContainer.locator(".flex.items-start.gap-3.flex-1");
    await expect(titleContainer).toHaveClass(/flex-1/);

    // Check that title has proper constraints
    const title = titleContainer.locator(".credential-card-title");
    const titleStyles = await title.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        overflow: computed.overflow,
        textOverflow: computed.textOverflow,
        whiteSpace: computed.whiteSpace,
      };
    });

    // Title should have text truncation styles
    expect(titleStyles.overflow).toBe("hidden");
    expect(titleStyles.textOverflow).toBe("ellipsis");
    expect(titleStyles.whiteSpace).toBe("nowrap");
  });

  test("points container should not expand beyond its designated space", async ({ page }) => {
    await setScenario(page, "ethereum-verified");

    const viewports = ["mobile", "desktop", "desktop-wide"];

    for (const viewport of viewports) {
      await setViewportSize(page, viewport);

      const credentialCards = page.locator(".credential-card");
      const cardCount = await credentialCards.count();

      for (let i = 0; i < cardCount; i++) {
        const card = credentialCards.nth(i);

        // Get the points container (icon + badge)
        const pointsContainer = card.locator(".flex.items-center.gap-1").last();
        const pointsContainerBox = await pointsContainer.boundingBox();

        // Points container should have flex-shrink-0 to prevent shrinking
        await expect(pointsContainer).toHaveClass(/flex-shrink-0/);

        // Check that points container width is reasonable
        if (pointsContainerBox) {
          // Points container should not be wider than ~100px (icon + badge + gap)
          expect(pointsContainerBox.width).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  test("long stamp titles should truncate with ellipsis", async ({ page }) => {
    // Test with scenarios that might have long titles
    await setScenario(page, "ethereum-verified");
    await setViewportSize(page, "mobile"); // Mobile is most constrained

    const credentialCards = page.locator(".credential-card");
    const cardCount = await credentialCards.count();

    for (let i = 0; i < cardCount; i++) {
      const card = credentialCards.nth(i);
      const title = card.locator(".credential-card-title");

      // Get the computed styles
      const titleStyles = await title.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          overflow: computed.overflow,
          textOverflow: computed.textOverflow,
          whiteSpace: computed.whiteSpace,
          width: rect.width,
          scrollWidth: el.scrollWidth,
        };
      });

      // Title should have proper truncation styles
      expect(titleStyles.overflow).toBe("hidden");
      expect(titleStyles.textOverflow).toBe("ellipsis");
      expect(titleStyles.whiteSpace).toBe("nowrap");

      // If text is truncated, scrollWidth should be greater than width
      // This ensures the ellipsis is working when needed
      if (titleStyles.scrollWidth > titleStyles.width) {
        console.log(`Card ${i} title is properly truncated`);
      }
    }
  });

  test("points badge should have minimum width to prevent text cramping", async ({ page }) => {
    const scenarios = ["ethereum-verified", "gtc-staking-verified"];

    for (const scenario of scenarios) {
      await setScenario(page, scenario);
      await setViewportSize(page, "mobile");

      const pointsBadges = page.locator(".points-badge");
      const badgeCount = await pointsBadges.count();

      for (let i = 0; i < badgeCount; i++) {
        const badge = pointsBadges.nth(i);
        const badgeBox = await badge.boundingBox();

        if (badgeBox) {
          // Badge should have minimum width to display points properly
          expect(badgeBox.width).toBeGreaterThanOrEqual(35); // Minimum for "+0.5"
        }

        // Check computed styles
        const badgeStyles = await badge.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            minWidth: computed.minWidth,
            whiteSpace: computed.whiteSpace,
          };
        });

        // Badge should prevent text wrapping
        expect(badgeStyles.whiteSpace).toBe("nowrap");
      }
    }
  });

  test("visual regression - points overflow fix", async ({ page }) => {
    const testCases = [
      { scenario: "ethereum-verified", viewport: "mobile" },
      { scenario: "ethereum-verified", viewport: "desktop" },
      { scenario: "gtc-staking-verified", viewport: "desktop-wide" },
      { scenario: "clean-hands-verified", viewport: "desktop" },
    ];

    for (const { scenario, viewport } of testCases) {
      await setScenario(page, scenario);
      await setViewportSize(page, viewport);

      // Take screenshot focusing on credential cards
      const stampsSection = page.locator(".grid").first();
      await stampsSection.screenshot({
        path: `test-results/points-overflow-fix-${scenario}-${viewport}.png`,
      });

      // Also capture individual problematic cards
      const cards = page.locator(".credential-card");
      const firstCard = cards.first();
      if (await firstCard.count() > 0) {
        await firstCard.screenshot({
          path: `test-results/points-overflow-fix-card-${scenario}-${viewport}.png`,
        });
      }
    }
  });

  test("stamp card grid should maintain proper spacing with overflow fix", async ({ page }) => {
    await setScenario(page, "ethereum-verified");

    const viewports = ["mobile", "desktop", "desktop-wide"];

    for (const viewport of viewports) {
      await setViewportSize(page, viewport);

      const grid = page.locator(".grid").first();
      const gridStyles = await grid.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          gap: computed.gap,
          gridTemplateColumns: computed.gridTemplateColumns,
        };
      });

      // Grid should have proper gap
      expect(gridStyles.gap).toMatch(/\d+px/);

      // Check that cards don't overlap
      const cards = page.locator(".credential-card");
      const cardCount = await cards.count();

      if (cardCount >= 2) {
        const firstCardBox = await cards.first().boundingBox();
        const secondCardBox = await cards.nth(1).boundingBox();

        if (firstCardBox && secondCardBox) {
          // Cards should not overlap horizontally if in same row
          if (Math.abs(firstCardBox.y - secondCardBox.y) < 10) {
            expect(firstCardBox.x + firstCardBox.width).toBeLessThan(secondCardBox.x);
          }
        }
      }
    }
  });

  test("points icon and badge should maintain proper alignment", async ({ page }) => {
    await setScenario(page, "ethereum-verified");
    await setViewportSize(page, "desktop");

    const cards = page.locator(".credential-card");
    const firstCard = cards.first();

    // Get the points container
    const pointsContainer = firstCard.locator(".flex.items-center.gap-1").last();
    
    // Check alignment styles
    const containerStyles = await pointsContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        alignItems: computed.alignItems,
        gap: computed.gap,
      };
    });

    expect(containerStyles.display).toBe("flex");
    expect(containerStyles.alignItems).toBe("center");
    expect(containerStyles.gap).toMatch(/\d+px/);

    // Check icon and badge are vertically centered
    const icon = pointsContainer.locator(".points-icon");
    const badge = pointsContainer.locator(".points-badge");

    const iconBox = await icon.boundingBox();
    const badgeBox = await badge.boundingBox();

    if (iconBox && badgeBox) {
      // Icon and badge should be roughly vertically aligned
      const centerDiff = Math.abs(
        (iconBox.y + iconBox.height / 2) - (badgeBox.y + badgeBox.height / 2)
      );
      expect(centerDiff).toBeLessThan(3); // Allow small difference
    }
  });
});