# Stamp Drawer Playwright Tests

This directory contains Playwright tests for the stamp drawer UI component to catch layout regressions and ensure consistent behavior across breakpoints.

## Setup

1. Install dependencies:
```bash
cd test-components
npm install
npm run install:playwright
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI (recommended for debugging)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug specific test
npm run test:debug

# View test report after run
npm run test:report
```

## Test Coverage

### Layout Issue Tests
- ✅ 3-column layout verification (2 stamp cols + 1 steps col)
- ✅ Stamp grid constraints (ensuring stamps stay in single cells)
- ✅ Title section positioning (should be within stamp columns)
- ✅ Mobile layout order (steps should come before stamps)

### Visual Regression Tests
- ✅ All scenarios at mobile (375x812)
- ✅ All scenarios at tablet (768x1024)
- ✅ All scenarios at desktop (1280x800)
- ✅ All scenarios at desktop-wide (1920x1080)

### Interaction Tests
- ✅ Verify button functionality
- ✅ Close button positioning

## Current Known Issues (from tests)

1. **3-Column Layout**: Currently only shows 2 columns (stamps + steps), not 3 columns with 2 stamp columns
2. **Mobile Order**: Stamps appear before steps, should be reversed
3. **Title Positioning**: Header spans full drawer width instead of just stamp section
4. **Grid Constraints**: No explicit single-cell constraint for stamps

## Test Results

Test results are saved in:
- `test-results/` - Screenshots and traces
- `playwright-report/` - HTML report

## Adding New Tests

Add new test cases to `playwright-tests/stamp-drawer.spec.ts`. Follow the existing patterns for:
- Layout verification tests
- Visual regression tests  
- Interaction tests

## Tips

- Use `test:ui` mode for interactive debugging
- Screenshots are automatically taken on failure
- Check `test-results/` folder for visual evidence of issues
- Use `page.pause()` in tests to debug step-by-step