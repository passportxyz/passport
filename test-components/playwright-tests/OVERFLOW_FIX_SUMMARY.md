# Stamp Drawer Points Overflow Fix

## Problem
The "+0.5" points text was overflowing outside the card boundary in the stamp drawer component.

## Solution Implemented

### 1. CSS Updates
Added proper flexbox constraints to prevent overflow:

#### Credential Card Title
```css
.credential-card-title {
  /* ... existing styles ... */
  /* Fix overflow with proper constraints */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

#### Points Badge
```css
.points-badge {
  /* ... existing styles ... */
  /* Prevent text wrapping and ensure minimum width */
  white-space: nowrap;
  min-width: 35px;
}
```

### 2. JSX Structure Updates

#### Title Container
Added `min-w-0` class to allow proper flexbox overflow handling:
```jsx
<div className="flex items-start gap-3 flex-1 min-w-0">
  {/* checkmark icon if verified */}
  <h4 className="credential-card-title flex-1 min-w-0">{name}</h4>
</div>
```

#### Points Container
Added `flex-shrink-0` to prevent the points container from shrinking:
```jsx
<div className="flex items-center gap-1 flex-shrink-0">
  <span className={`points-icon ${...}`}>
    {/* star icon */}
  </span>
  <span className={`points-badge ${...}`}>
    {pointsDisplay}
  </span>
</div>
```

## Key Flexbox Principles Applied

1. **Parent Container**: Uses `justify-between` to separate title and points
2. **Title Section**: Has `flex-1` and `min-w-0` to grow and allow truncation
3. **Points Section**: Has `flex-shrink-0` to maintain its size
4. **Title Element**: Uses text truncation CSS (overflow, text-overflow, white-space)
5. **Points Badge**: Has `min-width` and `white-space: nowrap` to prevent cramping

## Test Results
All 8 tests are now passing, confirming that:
- Points text does not overflow card boundaries across all viewports
- Card titles truncate properly with ellipsis when too long
- Points badges maintain minimum width and proper alignment
- Flexbox constraints are properly applied
- Visual regression tests show the fix works correctly

The fix ensures that the stamp cards maintain proper layout integrity regardless of content length or viewport size.