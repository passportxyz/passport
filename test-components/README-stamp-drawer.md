# Stamp Drawer Test Components

## Unified Test Component

The main test component is now **`stamp-drawer-unified.html`** which consolidates all functionality into a single, comprehensive test page.

### Features

1. **Multiple Scenarios**:
   - Ethereum (Not Verified)
   - Ethereum (Verified)
   - Clean Hands (Not Verified)
   - Clean Hands (Verified)

2. **Responsive Viewport Sizes**:
   - Mobile (375px) - Full width, single column
   - Desktop (580px) - Standard drawer width, 2 columns
   - Desktop Wide (1400px) - Wide drawer, 3 columns

3. **Key Improvements**:
   - **Individually scrollable sections** for desktop views
   - **Stamps on the left, steps on the right** for guided flow (Clean Hands)
   - **Responsive grid system** that adjusts based on viewport
   - **Consistent design language** across all variants
   - **Enhanced visual hierarchy** with proper spacing and typography

### Usage

1. Open `stamp-drawer-unified.html` in a browser
2. Use the test controls to switch between:
   - Different scenarios (platforms and verification states)
   - Different viewport sizes
3. Test scrolling behavior in the desktop views
4. Toggle the drawer open/closed

### Component Architecture

- **Multi-Credential View** (Ethereum): Standard layout with responsive grid
- **Guided Flow View** (Clean Hands): 
  - Mobile: Single column with all content stacked
  - Desktop: Two-column layout with stamps on left, steps on right
  - Each section scrolls independently on desktop

### Design Highlights

- Points module adapts to viewport (compact on mobile)
- Credential cards maintain consistent height
- Step-by-step guide has proper visual hierarchy
- Custom scrollbars for desktop views
- Proper handling of credential states (verified, expired, deduplicated)

### Cleanup Recommendation

The older test files can be archived or removed:
- stamp-drawer-final.html
- stamp-drawer-desktop-improved.html
- stamp-drawer-mobile-*.html
- stamp-drawer-responsive.html
- stamp-drawer-simple.html
- stamp-drawer-test*.html

The unified component (`stamp-drawer-unified.html`) contains all functionality and improvements from these files.