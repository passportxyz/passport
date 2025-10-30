# TopNav Dynamic Implementation Workflow

## Implementation Approach

### Phase 1: Type Preparation
1. Update `CustomizationResponse` type to include `partnerDashboards` array
2. Define `PartnerDashboard` interface with required fields

### Phase 2: Frontend Data Integration
1. **Filter dashboards in MinimalHeader**
   - Filter where `showInTopNav === true`
   - Use `useMemo` for performance

2. **Add isCurrent logic**
   - Determine from URL params on frontend
   - Not sent from backend

3. **Render SVG logos**
   - Sanitize with `DOMPurify.sanitize()`
   - Use `dangerouslySetInnerHTML` for rendering

### Phase 3: Migration Steps
1. Prepare types and components
2. Deploy backend with dashboard data
3. Switch frontend to use dynamic data
4. Clean up hardcoded partner data

## Implementation Details

### Data Processing Pattern
```typescript
const visibleDashboards = useMemo(() => {
  const dashboards = customizationResponse?.partnerDashboards || [];
  const currentPartnerId = getCurrentPartnerId(); // from URL

  return dashboards
    .filter(d => d.showInTopNav)
    .map(d => ({
      ...d,
      isCurrent: d.id === currentPartnerId
    }));
}, [customizationResponse, currentPartnerId]);
```

### SVG Rendering Pattern
```typescript
<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(dashboard.logo)
  }}
/>
```

### Edge Case Handling
- Empty arrays: Show features only
- Undefined partnerDashboards: Treat as empty array
- Invalid SVG: DOMPurify handles sanitization
- Network failures: Existing error handling in useCustomization

## Key Decisions

1. **Features remain hardcoded** - As requested, only partner dashboards dynamic
2. **Array order = display order** - No client-side sorting
3. **isCurrent on frontend only** - Computed based on route
4. **No order field** - Simplifies API and admin interface

## Testing Considerations
- Test with 0, 1, and many dashboards
- Verify SVG sanitization
- Check responsive behavior with different dashboard counts
- Validate routing to partner dashboards

## Related Files
- `TopNav_Frontend_Implementation.md` - Detailed implementation guide
- `app/components/MinimalHeader.tsx` - Main integration point
- `app/components/TopNav/components/TopNav.tsx` - Component to update
- `app/hooks/useCustomization.tsx` - Hook for fetching data