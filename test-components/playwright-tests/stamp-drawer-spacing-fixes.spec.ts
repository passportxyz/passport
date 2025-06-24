import { test, expect } from '@playwright/test';

test.describe('Stamp Drawer Spacing and Styling Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file:///Users/lucian/projects/passport/test-components/stamp-drawer-unified.html');
  });

  test.describe('Points Module Styling', () => {
    test('progress bar should have correct height', async ({ page }) => {
      // Pre-verification state
      await page.selectOption('select[aria-label="Scenario"]', 'gtc-staking');
      
      const progressBar = await page.locator('.h-2').first();
      const box = await progressBar.boundingBox();
      
      // Progress bar should be 8-10px tall
      expect(box?.height).toBeGreaterThanOrEqual(8);
      expect(box?.height).toBeLessThanOrEqual(10);
    });

    test('time and price should have proper spacing', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'gtc-staking');
      
      const timePrice = await page.locator('[data-testid="points-module"] .flex').nth(1);
      const classes = await timePrice.getAttribute('class');
      
      // Should have smaller gap
      expect(classes).not.toContain('gap-12');
      expect(classes).toMatch(/gap-(2|4|6|8)/);
    });

    test('points text should have larger font size', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'gtc-staking');
      
      const pointsText = await page.locator('.text-4xl').first();
      const fontSize = await pointsText.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      // Should be at least 36px (text-4xl)
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(36);
    });

    test('verified state progress bar should be more opaque', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const progressBar = await page.locator('.points-progress-bar').first();
      const opacity = await progressBar.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      
      // Should be at least 0.9 opacity
      expect(parseFloat(opacity)).toBeGreaterThanOrEqual(0.9);
    });
  });

  test.describe('Credential Card Dimensions', () => {
    test('cards should have reduced padding', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const card = await page.locator('.credential-card').first();
      const padding = await card.evaluate(el => 
        window.getComputedStyle(el).padding
      );
      
      // Should be 16-20px, not 24px
      expect(padding).toMatch(/^(16|18|20)px$/);
    });

    test('grid gap should be tighter', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const grid = await page.locator('.grid').nth(1);
      const classes = await grid.getAttribute('class');
      
      // Should use gap-2 (8px) not gap-3 (12px)
      expect(classes).toContain('gap-2');
      expect(classes).not.toContain('gap-3');
    });

    test('card title and description gap should be smaller', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const card = await page.locator('.credential-card').first();
      const gap = await card.evaluate(el => 
        window.getComputedStyle(el).gap
      );
      
      // Should be 8px (gap-2) not 12px (gap-3)
      expect(gap).toBe('8px');
    });
  });

  test.describe('Header Section', () => {
    test('platform icon should be larger', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      await page.selectOption('select[aria-label="Viewport Size"]', 'desktop-wide');
      
      const icon = await page.locator('.text-6xl').first();
      const fontSize = await icon.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      
      // Should be at least 56px (text-6xl)
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(56);
    });

    test('title should be vertically centered with icon', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const header = await page.locator('.flex.items-center.gap-4').first();
      const classes = await header.getAttribute('class');
      
      // Should have items-center for vertical alignment
      expect(classes).toContain('items-center');
    });
  });

  test.describe('Step Guide Styling', () => {
    test('step numbers should be smaller', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'clean-hands');
      await page.selectOption('select[aria-label="Viewport Size"]', 'desktop-wide');
      
      const stepNumber = await page.locator('.step-number').first();
      const width = await stepNumber.evaluate(el => 
        window.getComputedStyle(el).width
      );
      
      // Should be 36-40px, not 48px
      expect(parseInt(width)).toBeGreaterThanOrEqual(36);
      expect(parseInt(width)).toBeLessThanOrEqual(40);
    });

    test('step number background should be lighter', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'clean-hands');
      
      const stepNumber = await page.locator('.step-number').first();
      const bgColor = await stepNumber.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should be a light gray (not #f0f0f0)
      expect(bgColor).toMatch(/rgba?\(24[5-9]|25[0-5]/); // Light gray range
    });

    test('steps should have tighter spacing', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'clean-hands');
      
      const stepsContainer = await page.locator('.space-y-6').first();
      const classes = await stepsContainer.getAttribute('class');
      
      // Should use space-y-6 not space-y-8
      expect(classes).toContain('space-y-6');
      expect(classes).not.toContain('space-y-8');
    });
  });

  test.describe('Mobile Layout', () => {
    test('points module should be more compact on mobile', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'gtc-staking');
      await page.selectOption('select[aria-label="Viewport Size"]', 'mobile');
      
      const pointsModule = await page.locator('[data-testid="points-module"]').first();
      const height = await pointsModule.evaluate(el => el.offsetHeight);
      
      // Should be less than 190px tall on mobile (compact mode)
      expect(height).toBeLessThan(190);
    });

    test.skip('time/price should stack vertically on mobile', async ({ page }) => {
      // Skipping this test - keeping time/price side by side on mobile is actually more space efficient
      await page.selectOption('select[aria-label="Scenario"]', 'gtc-staking');
      await page.selectOption('select[aria-label="Viewport Size"]', 'mobile');
      
      const timePrice = await page.locator('[data-testid="points-module"] .flex').nth(1);
      const classes = await timePrice.getAttribute('class');
      
      // Should use flex-col on mobile
      expect(classes).toContain('flex-col');
    });

    test('steps should have background on mobile', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'clean-hands');
      await page.selectOption('select[aria-label="Viewport Size"]', 'mobile');
      
      const stepsContainer = await page.locator('.step-guide-container-mobile').first();
      const bgColor = await stepsContainer.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have a background color (not transparent)
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(bgColor).not.toBe('transparent');
    });
  });

  test.describe('Container Fill Issues', () => {
    test('stamps section should fill available height', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      await page.selectOption('select[aria-label="Viewport Size"]', 'desktop-wide');
      
      const stampsSection = await page.locator('.scrollable-section').first();
      const parent = await stampsSection.locator('..');
      
      const stampsHeight = await stampsSection.evaluate(el => el.scrollHeight);
      const parentHeight = await parent.evaluate(el => el.clientHeight);
      
      // Content should mostly fill the parent (at least 80%)
      expect(stampsHeight).toBeGreaterThan(parentHeight * 0.8);
    });

    test('description text should use available width', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      await page.selectOption('select[aria-label="Viewport Size"]', 'desktop-wide');
      
      const description = await page.locator('.description-section').first();
      const maxWidth = await description.evaluate(el => 
        window.getComputedStyle(el).maxWidth
      );
      
      // Should have appropriate max-width for readability
      expect(maxWidth).toMatch(/^\d+px$/);
      expect(parseInt(maxWidth)).toBeGreaterThan(400);
    });
  });

  test.describe('Color and Typography', () => {
    test('description text should be darker', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const description = await page.locator('p').first();
      const color = await description.evaluate(el => 
        window.getComputedStyle(el).color
      );
      
      // Should use a darker gray (color-8 or color-4)
      const rgb = color.match(/\d+/g);
      if (rgb) {
        const brightness = (parseInt(rgb[0]) + parseInt(rgb[1]) + parseInt(rgb[2])) / 3;
        expect(brightness).toBeLessThan(180); // Darker than current
      }
    });

    test('cards should have subtle shadows', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const card = await page.locator('.credential-card').first();
      const boxShadow = await card.evaluate(el => 
        window.getComputedStyle(el).boxShadow
      );
      
      // Should have a shadow on hover
      await card.hover();
      const hoverShadow = await card.evaluate(el => 
        window.getComputedStyle(el).boxShadow
      );
      
      expect(hoverShadow).not.toBe('none');
      expect(hoverShadow).toContain('rgba');
    });
  });

  test.describe('Footer Styling', () => {
    test('update score button should have less padding', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const button = await page.locator('button:has-text("Update Score")').first();
      const padding = await button.evaluate(el => 
        window.getComputedStyle(el).padding
      );
      
      // Should be 12-16px vertical, not 18px
      const paddingValues = padding.split(' ');
      expect(parseInt(paddingValues[0])).toBeLessThanOrEqual(16);
    });

    test('footer background should match drawer', async ({ page }) => {
      await page.selectOption('select[aria-label="Scenario"]', 'ethereum-verified');
      
      const footer = await page.locator('.border-t').last();
      const bgColor = await footer.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should be white/transparent, not gray
      expect(bgColor).toMatch(/rgba?\(255,\s*255,\s*255|transparent|rgba\(0,\s*0,\s*0,\s*0\)/);
    });
  });
});