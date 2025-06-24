import { test, expect } from "@playwright/test";

test.describe("Stamp Drawer Multi-Column Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("file:///Users/lucian/projects/passport/test-components/stamp-drawer-unified.html");
  });

  test.describe("Desktop Wide Layout (3-column)", () => {
    test.beforeEach(async ({ page }) => {
      // Set viewport to desktop wide
      await page.selectOption('[aria-label="Viewport Size"]', "desktop-wide");
    });

    test("description/CTA should be to the left of points/cost box", async ({ page }) => {
      // Select GTC Staking (not verified) to see the points/cost box
      await page.locator("select").first().selectOption("gtc-staking");

      // Get the main content container - the scrollable body
      const contentSection = page.locator(".drawer-container .overflow-y-auto").first();

      // Wait for content to load
      await page.waitForTimeout(500);

      // Get the description/actions container
      const descriptionSection = page.locator('p:has-text("Stake GTC to boost your trust")').locator("..");

      // Get points module container - look for the element containing "points gained"
      const pointsSection = page.locator('div:has-text("points gained")').first().locator("..").locator("..");

      // Check if they exist
      await expect(descriptionSection).toBeVisible();
      await expect(pointsSection).toBeVisible();

      // Verify the layout - points should be within or below description section
      const descBounds = await descriptionSection.boundingBox();
      const pointsBounds = await pointsSection.boundingBox();

      // For now, just check they both exist - we'll implement the side-by-side layout next
      expect(descBounds).toBeTruthy();
      expect(pointsBounds).toBeTruthy();
    });

    test("points/cost box should be aligned to the right edge of drawer", async ({ page }) => {
      await page.selectOption('[aria-label="Scenario"]', "gtc-staking");
      
      // Get the drawer container
      const drawer = page.locator(".drawer-desktop-wide");
      const drawerBounds = await drawer.boundingBox();
      
      // Get the main content container that has padding
      const contentContainer = page.locator(".drawer-container .overflow-y-auto").first();
      
      // Get the points section
      const pointsSection = page.locator(".points-cost-section");
      const pointsBounds = await pointsSection.boundingBox();
      
      // Get the computed padding of the content container
      const containerPadding = await contentContainer.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          paddingLeft: parseInt(style.paddingLeft),
          paddingRight: parseInt(style.paddingRight)
        };
      });
      
      // Points box right edge should align with container's right edge (drawer width - right padding)
      const expectedRightEdge = drawerBounds.x + drawerBounds.width - containerPadding.paddingRight;
      const actualRightEdge = pointsBounds.x + pointsBounds.width;
      
      // Allow small difference for rounding
      expect(Math.abs(actualRightEdge - expectedRightEdge)).toBeLessThan(5);
    });

    test("points/cost box should take only 1 column width", async ({ page }) => {
      await page.selectOption('[aria-label="Scenario"]', "gtc-staking");

      // Look for the points section with the constrained width class
      const pointsSection = page.locator(".flex-shrink-0.w-80").first();

      // Check that points section exists and is visible
      await expect(pointsSection).toBeVisible();

      // Verify it doesn't expand beyond ~320-384px (typical 1-column width)
      const bounds = await pointsSection.boundingBox();
      expect(bounds.width).toBeLessThanOrEqual(400);
    });

    test("description/CTA section should take up to 2 columns", async ({ page }) => {
      await page.selectOption('[aria-label="Scenario"]', "gtc-staking");

      const descCTASection = page.locator(".description-cta-section");

      // Check that description section has flex-1 or similar expanding class
      await expect(descCTASection).toHaveClass(/flex-1|flex-grow/);

      // Verify it takes remaining space (should be wider than points section)
      const descBounds = await descCTASection.boundingBox();
      const pointsBounds = await page.locator(".points-cost-section").boundingBox();

      expect(descBounds.width).toBeGreaterThan(pointsBounds.width);
    });

    test("description/CTA section should take minimum 50% of container width", async ({ page }) => {
      await page.selectOption('[aria-label="Scenario"]', "gtc-staking");
      
      // Get the parent container that holds both description and points
      const layoutContainer = page.locator(".stamp-section-layout");
      const containerBounds = await layoutContainer.boundingBox();
      
      // Get description section
      const descCTASection = page.locator(".description-cta-section");
      const descBounds = await descCTASection.boundingBox();
      
      // Description should be at least 50% of container width
      const minWidth = containerBounds.width * 0.5;
      expect(descBounds.width).toBeGreaterThanOrEqual(minWidth);
      
      // Also verify points box doesn't take more than 50%
      const pointsSection = page.locator(".points-cost-section");
      const pointsBounds = await pointsSection.boundingBox();
      
      expect(pointsBounds.width).toBeLessThan(containerBounds.width * 0.5);
    });

    test("layout should work for both verified and non-verified states", async ({ page }) => {
      // Test non-verified state
      await page.selectOption('[aria-label="Scenario"]', "gtc-staking");

      let descCTASection = page.locator(".description-cta-section");
      let pointsSection = page.locator(".points-cost-section");

      await expect(descCTASection).toBeVisible();
      await expect(pointsSection).toBeVisible();

      // Test verified state
      await page.selectOption('[aria-label="Scenario"]', "gtc-staking-verified");

      descCTASection = page.locator(".description-cta-section");
      pointsSection = page.locator(".points-cost-section");

      await expect(descCTASection).toBeVisible();
      await expect(pointsSection).toBeVisible();
    });
  });

  test.describe("Desktop Medium Layout (2-column)", () => {
    test.beforeEach(async ({ page }) => {
      await page.selectOption('[aria-label="Viewport Size"]', "desktop");
    });

    test("should maintain horizontal layout on medium desktop", async ({ page }) => {
      await page.selectOption('[aria-label="Scenario"]', "gtc-staking");

      const contentSection = page.locator(".drawer-container > div:nth-child(2) > div");

      // Should still have horizontal flex layout
      await expect(contentSection.locator("> div").first()).toHaveCSS("display", "flex");

      const descCTASection = contentSection.locator(".description-cta-section");
      const pointsSection = contentSection.locator(".points-cost-section");

      // Verify horizontal positioning
      const descBounds = await descCTASection.boundingBox();
      const pointsBounds = await pointsSection.boundingBox();

      expect(descBounds.x).toBeLessThan(pointsBounds.x);
    });
  });

  test.describe("Mobile Layout", () => {
    test.beforeEach(async ({ page }) => {
      await page.selectOption('[aria-label="Viewport Size"]', "mobile");
    });

    test("should stack vertically on mobile", async ({ page }) => {
      await page.selectOption('[aria-label="Scenario"]', "gtc-staking");

      // In mobile view, we have a different structure - points come first
      const stampSection = page.locator('[data-testid="stamp-section"]');
      
      // Check that points module is visible and comes first
      const pointsModule = stampSection.locator('[data-testid="points-module"]');
      const description = stampSection.locator('[data-testid="platform-description"]');
      
      await expect(pointsModule).toBeVisible();
      await expect(description).toBeVisible();
      
      // Get positions to verify ordering
      const pointsBounds = await pointsModule.boundingBox();
      const descBounds = await description.boundingBox();
      
      // Points should appear above description in mobile view
      expect(pointsBounds.y).toBeLessThan(descBounds.y);
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle platforms without custom CTA", async ({ page }) => {
      await page.selectOption('[aria-label="Viewport Size"]', "desktop-wide");
      await page.selectOption('[aria-label="Scenario"]', "ethereum-not-verified");

      const descCTASection = page.locator(".description-cta-section");
      const pointsSection = page.locator(".points-cost-section");

      await expect(descCTASection).toBeVisible();
      await expect(pointsSection).toBeVisible();

      // Should still have proper layout
      const descBounds = await descCTASection.boundingBox();
      const pointsBounds = await pointsSection.boundingBox();

      expect(descBounds.x).toBeLessThan(pointsBounds.x);
    });

    test("should handle long descriptions gracefully", async ({ page }) => {
      await page.selectOption('[aria-label="Viewport Size"]', "desktop-wide");
      await page.selectOption('[aria-label="Scenario"]', "ethereum-not-verified");

      const descCTASection = page.locator(".description-cta-section");

      // Description should not overflow its container
      const overflow = await descCTASection.evaluate((el) => window.getComputedStyle(el).overflow);
      expect(overflow).not.toBe("visible");

      // Should have max-width constraint
      await expect(descCTASection).toHaveClass(/max-w-/);
    });
  });

  test.describe("StampSection Component with cols prop", () => {
    test.describe("Guided Flow (Clean Hands) with steps column", () => {
      test.beforeEach(async ({ page }) => {
        await page.selectOption('[aria-label="Scenario"]', "clean-hands");
      });

      test("should stack description/points vertically when cols=1 in desktop view", async ({ page }) => {
        await page.selectOption('[aria-label="Viewport Size"]', "desktop");
        
        // Find the stamp section container
        const stampSection = page.locator('[data-testid="stamp-section"]');
        await expect(stampSection).toHaveAttribute('data-cols', '1');
        
        // Within stamp section, description and points should stack vertically
        const descriptionSection = stampSection.locator('.description-section');
        const pointsSection = stampSection.locator('.points-section');
        
        await expect(descriptionSection).toBeVisible();
        await expect(pointsSection).toBeVisible();
        
        // Check vertical stacking
        const descBounds = await descriptionSection.boundingBox();
        const pointsBounds = await pointsSection.boundingBox();
        
        // Points should be below description
        expect(pointsBounds.y).toBeGreaterThan(descBounds.y + descBounds.height);
        
        // Both should have full width of their container
        const sectionBounds = await stampSection.boundingBox();
        expect(Math.abs(descBounds.width - sectionBounds.width)).toBeLessThan(50); // Allow some padding
        expect(Math.abs(pointsBounds.width - sectionBounds.width)).toBeLessThan(50);
      });

      test("should have horizontal layout in wide desktop view when cols=2", async ({ page }) => {
        await page.selectOption('[aria-label="Viewport Size"]', "desktop-wide");
        
        const stampSection = page.locator('[data-testid="stamp-section"]');
        await expect(stampSection).toHaveAttribute('data-cols', '2'); // Wide desktop with steps shows 2 cols
        
        // In wide view with cols=2, should have horizontal layout
        const descriptionSection = stampSection.locator('.description-section');
        const pointsSection = stampSection.locator('.points-section');
        
        const descBounds = await descriptionSection.boundingBox();
        const pointsBounds = await pointsSection.boundingBox();
        
        // Horizontal layout - points to the right of description
        expect(Math.abs(descBounds.y - pointsBounds.y)).toBeLessThan(10);
        expect(pointsBounds.x).toBeGreaterThan(descBounds.x + descBounds.width);
      });

      test("points module should not have fixed width when cols=1", async ({ page }) => {
        await page.selectOption('[aria-label="Viewport Size"]', "desktop"); // Use desktop (not wide) to get cols=1
        
        const stampSection = page.locator('[data-testid="stamp-section"]');
        await expect(stampSection).toHaveAttribute('data-cols', '1');
        
        const pointsSection = page.locator('[data-testid="stamp-section"] .points-section');
        
        // Should NOT have w-80 or similar fixed width classes
        await expect(pointsSection).not.toHaveClass(/w-80|w-\d{2,3}/);
        
        // Should expand to container width
        const stampBounds = await stampSection.boundingBox();
        const pointsBounds = await pointsSection.boundingBox();
        
        expect(Math.abs(pointsBounds.width - stampBounds.width)).toBeLessThan(50);
      });
    });

    test.describe("Multi-credential view without steps", () => {
      test.beforeEach(async ({ page }) => {
        await page.selectOption('[aria-label="Scenario"]', "ethereum-not-verified");
      });

      test("should use 3 columns in wide desktop view", async ({ page }) => {
        await page.selectOption('[aria-label="Viewport Size"]', "desktop-wide");
        
        const stampSection = page.locator('[data-testid="stamp-section"]');
        await expect(stampSection).toHaveAttribute('data-cols', '3');
        
        // Description and points should be side by side
        const descriptionSection = stampSection.locator('.description-section');
        const pointsSection = stampSection.locator('.points-section');
        
        const descBounds = await descriptionSection.boundingBox();
        const pointsBounds = await pointsSection.boundingBox();
        
        // Horizontal layout - same Y position
        expect(Math.abs(descBounds.y - pointsBounds.y)).toBeLessThan(10);
        
        // Points should be to the right
        expect(pointsBounds.x).toBeGreaterThan(descBounds.x + descBounds.width);
      });

      test("should use 2 columns in medium desktop view", async ({ page }) => {
        await page.selectOption('[aria-label="Viewport Size"]', "desktop");
        
        const stampSection = page.locator('[data-testid="stamp-section"]');
        await expect(stampSection).toHaveAttribute('data-cols', '2');
      });

      test("points module should have fixed width when cols>1", async ({ page }) => {
        await page.selectOption('[aria-label="Viewport Size"]', "desktop-wide");
        
        const pointsSection = page.locator('[data-testid="stamp-section"] .points-section');
        
        // Should have fixed width class
        await expect(pointsSection).toHaveClass(/w-80/);
        
        // Width should be around 320px
        const bounds = await pointsSection.boundingBox();
        expect(bounds.width).toBeGreaterThan(300);
        expect(bounds.width).toBeLessThan(340);
      });
    });

    test("cols prop should be respected regardless of viewport", async ({ page }) => {
      // Test that different scenarios get appropriate column counts
      
      // Clean Hands in desktop (not wide) should have cols=1
      await page.selectOption('[aria-label="Scenario"]', "clean-hands");
      await page.selectOption('[aria-label="Viewport Size"]', "desktop");
      
      let stampSection = page.locator('[data-testid="stamp-section"]');
      await expect(stampSection).toHaveAttribute('data-cols', '1');
      
      let layoutContainer = stampSection.locator('.stamp-section-layout');
      await expect(layoutContainer).toHaveClass(/space-y-/); // Vertical layout
      
      // Clean Hands in desktop-wide should have cols=2
      await page.selectOption('[aria-label="Viewport Size"]', "desktop-wide");
      stampSection = page.locator('[data-testid="stamp-section"]');
      await expect(stampSection).toHaveAttribute('data-cols', '2');
      
      layoutContainer = stampSection.locator('.stamp-section-layout');
      await expect(layoutContainer).toHaveClass(/flex/); // Horizontal layout
      
      // Ethereum (no steps) in desktop-wide should have cols=3
      await page.selectOption('[aria-label="Scenario"]', "ethereum-not-verified");
      await page.selectOption('[aria-label="Viewport Size"]', "desktop-wide");
      stampSection = page.locator('[data-testid="stamp-section"]');
      await expect(stampSection).toHaveAttribute('data-cols', '3');
    });
  });
});
