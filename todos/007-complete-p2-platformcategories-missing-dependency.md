---
status: complete
priority: p2
issue_id: "018"
tags: [code-review, frontend, react-hooks]
dependencies: []
---

# platformCategories useMemo Missing partnerName Dependency

## Problem Statement

The `platformCategories` memo reads `partnerName` inside its callback but the dependency array only includes `[customStamps]`. If `partnerName` changes independently of `customStamps`, the category name will be stale.

## Findings

**Source:** julik-frontend-races-reviewer (Finding 7)

At `app/hooks/usePlatforms.tsx:219-231`:
```typescript
const platformCategories = useMemo(() => {
  // Uses partnerName at line 224
  name: `${partnerName} Stamps`,
  // ...
}, [customStamps]); // Missing partnerName
```

## Proposed Solutions

Add `partnerName` to dependency array:
```typescript
}, [customStamps, partnerName]);
```

## Technical Details

### Affected Files
- `app/hooks/usePlatforms.tsx` (line 231)
