# TopNav Dynamic Content Architecture

## Overview
The TopNav component displays navigation features and partner custom dashboards. While features remain hardcoded, partner dashboards are fetched dynamically through the customization API.

## Architecture Decisions

### Data Flow
- Partner dashboards fetched via existing `useCustomization` hook
- API endpoint: `${SCORER_ENDPOINT}/account/customization/{customizationKey}`
- Dashboards are a top-level array in the customization response

### API Structure
```typescript
interface PartnerDashboard {
  id: string;          // Unique identifier
  name: string;        // Display name
  logo: string;        // Complete SVG string
  showInTopNav: boolean; // Per-dashboard visibility control
}

interface CustomizationResponse {
  // ... existing fields
  partnerDashboards?: PartnerDashboard[]; // Top-level array
}
```

### Key Design Choices

1. **SVG Handling**
   - Complete SVG strings sent from backend (not URLs or components)
   - Avoids frontend changes when adding new partners
   - Sanitized with DOMPurify on frontend (already in place)

2. **Display Control**
   - Individual `showInTopNav` flag per dashboard
   - Array order determines display order (no sorting needed)
   - Frontend filters dashboards where `showInTopNav === true`

3. **Routing Pattern**
   - Partner dashboards route to `/#/{partnerId}/dashboard`
   - `isCurrent` state determined by frontend based on current route

4. **Component Structure**
   - Features section: 4 hardcoded product links
   - Partner dashboards section: Dynamic list from API

## Implementation Details

### Backend Requirements
- SVG code stored in database
- Django admin for dashboard management
- Expected ~6 dashboards in TopNav
- No additional caching needed (piggybacks on existing customization fetch)

### Frontend Implementation
- Data preparation centralized in `useCustomization` hook via `requestCustomizationConfig`
- Hook returns pre-filtered `topNavDashboards` array (only where `showInTopNav === true`)
- `isCurrent` flag added by comparing dashboard.id with customizationKey
- Components consume ready-to-use data without additional processing
- SVG rendering: `SanitizedHTMLComponent` with DOMPurify sanitization
- Handles edge cases: empty arrays, undefined `partnerDashboards`

### Current Partner Set
Initial set of 6 partners with SVG logos:
- Lido
- Verax
- Shape
- Octant
- Recall
- Linea

## Related Files
- `app/components/TopNav/components/TopNav.tsx` - TopNav component
- `app/components/MinimalHeader.tsx` - Integration point
- `app/utils/customizationUtils.tsx` - Data fetching and preparation logic
- `TopNav_Backend_Requirements.md` - Backend implementation specs
- `TopNav_Frontend_Implementation.md` - Frontend implementation guide