# Customization Data Preparation Pattern

## Overview
The customization hook pre-filters and prepares data to keep components clean and focused on presentation logic.

## Pattern Description

### Centralized Data Transformation
Data transformation logic is centralized in the data layer (`requestCustomizationConfig` function) rather than scattered across components. This provides:

1. **Single source of truth** for data processing
2. **Cleaner components** that focus on presentation
3. **Easier testing** of data transformation logic
4. **Consistent data preparation** across the app

### Implementation Example: TopNav Dashboards

The `useCustomization` hook returns pre-filtered `topNavDashboards`:

```typescript
// In requestCustomizationConfig (utils/customizationUtils.tsx)
const topNavDashboards = partnerDashboards
  ?.filter(dashboard => dashboard.showInTopNav)
  .map(dashboard => ({
    ...dashboard,
    isCurrent: dashboard.id === customizationKey
  })) || [];

// Component simply consumes ready data
const { topNavDashboards } = useCustomization(customizationKey);
```

### Benefits
- **Components remain simple**: No filtering or transformation logic
- **Performance**: Filtering happens once at the data layer
- **Maintainability**: Changes to data preparation are centralized
- **Type safety**: Return types clearly define the prepared data structure

## When to Use This Pattern

Apply this pattern when:
- Multiple components need the same filtered/transformed data
- Data requires complex preparation before display
- You want to keep components focused on presentation
- Runtime state (like URL params) needs to be merged with fetched data

## Related Files
- `app/utils/customizationUtils.tsx` - Implementation of the pattern
- `app/components/MinimalHeader.tsx` - Consumer of prepared data
- `app/components/TopNav/components/TopNav.tsx` - Component using prepared data