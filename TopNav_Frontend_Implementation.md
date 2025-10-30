# TopNav Frontend Implementation Guide

## Overview
We're making the partner custom dashboards in TopNav dynamic. The features section (Real-time Verification, Embed, etc.) will remain hardcoded for now. This document outlines the frontend changes needed to integrate with the new backend API.

## Current State
- **Location**: Partner dashboards are hardcoded in `app/components/MinimalHeader.tsx` (lines 262-269)
- **Component**: `app/components/TopNav/components/TopNav.tsx`
- **Icons**: Currently stored as React components in `app/components/TopNav/components/Icons.tsx`

## New Data Structure from Backend

The backend will provide partner dashboards through the existing customization API:

```typescript
interface Customization {
  // ... existing fields ...

  partnerDashboards?: PartnerDashboard[];
}

interface PartnerDashboard {
  id: string;              // Used for routing: /#/{id}/dashboard
  name: string;            // Display name in TopNav
  logo: string;            // SVG string (complete SVG code)
  showInTopNav: boolean;   // Whether to show in TopNav
}
```

**Important Notes:**
- Array order = display order (no separate order field)
- `isCurrent` is NOT from backend - determine this on frontend based on current route
- SVG comes as a complete string, already sanitized by our existing DOMPurify setup

## Implementation Steps

### 1. Update Types in `app/utils/customizationUtils.tsx`

Add the new types to the `CustomizationResponse` interface:

```typescript
// Add to CustomizationResponse interface
type CustomizationResponse = {
  // ... existing fields ...

  partnerDashboards?: PartnerDashboard[];
};

// Add new interface
interface PartnerDashboard {
  id: string;
  name: string;
  logo: string;
  showInTopNav: boolean;
}
```

Update the `requestCustomizationConfig` function to include the new field:

```typescript
export const requestCustomizationConfig = async (customizationKey: string): Promise<Customization | undefined> => {
  const response = await axios.get(`${CUSTOMIZATION_ENDPOINT}/${customizationKey}`);
  const customizationResponse: CustomizationResponse = response.data;

  return {
    // ... existing fields ...

    partnerDashboards: customizationResponse.partnerDashboards,
  };
};
```

### 2. Update `app/components/MinimalHeader.tsx`

Replace the hardcoded partner dashboards with dynamic data:

```typescript
import { useCustomization } from "../hooks/useCustomization";
import { useParams } from "react-router-dom";

const MinimalHeader = ({ className }: MinimalHeaderProps): JSX.Element => {
  const { key } = useParams();
  const customization = useCustomization();

  // Filter for TopNav-visible dashboards and add isCurrent flag
  const partnerDashboards = useMemo(() => {
    const visibleDashboards = customization.partnerDashboards
      ?.filter(dashboard => dashboard.showInTopNav)
      ?.map(dashboard => ({
        ...dashboard,
        isCurrent: dashboard.id === key // Mark current based on URL
      })) || [];

    return visibleDashboards;
  }, [customization.partnerDashboards, key]);

  // Keep features hardcoded as before
  const navFeatures: NavFeature[] = [
    {
      icon: "user-check",
      title: "Real-time Verification",
      description: "Protect programs in real-time with Stamps and Models",
      url: "https://passport.human.tech/verification",
    },
    // ... rest of features remain the same
  ];

  return (
    <>
      {/* ... existing JSX ... */}

      {showTopNav ? (
        <TopNav
          features={navFeatures}
          partners={partnerDashboards}  // Now using dynamic data
          onClose={() => setShowTopNav(false)}
          buttonRef={navButtonRef}
        />
      ) : (
        // ... partner with us section
      )}
    </>
  );
};
```

### 3. Update TopNav Component Types

Update the `PartnerLink` interface in `app/components/TopNav/mocks/navData.ts`:

```typescript
export interface PartnerLink {
  id: string;
  name: string;
  logo: string;  // Now a string (SVG) instead of icon name
  isCurrent?: boolean;
}
```

### 4. Update TopNav Component to Use Existing SanitizedHTMLComponent

We already have the perfect component for this! Just import and use it.

Modify `app/components/TopNav/components/TopNav.tsx`:

```typescript
// Import the existing sanitization component
import { SanitizedHTMLComponent } from "../../utils/customizationUtils";

export const TopNav: React.FC<TopNavProps> = ({
  features = [],
  partners = [],
  onPartnerClick,
  onClose,
  buttonRef = null,
}) => {
  // ... existing code ...

  return (
    <div /* ... existing props ... */>
      {/* ... features section remains the same ... */}

      {/* Partner Custom Dashboards Section */}
      {partners.length > 0 && (
        <div className="bg-background box-border flex flex-col gap-4 items-start p-4 rounded-lg w-full">
          {/* ... header remains the same ... */}

          <div className="flex items-stretch gap-2 w-full">
            {partners.map((partner) => (
              <button
                key={partner.id}
                onClick={() => handlePartnerClick(partner.id)}
                className={
                  partner.isCurrent
                    ? "flex-1 bg-foreground brightness-[.83] shadow-md cursor-default box-border flex gap-2 items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-focus focus:ring-opacity-50"
                    : "flex-1 bg-foreground box-border flex gap-2 items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out hover:brightness-[.83] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-focus focus:ring-opacity-50"
                }
              >
                <div className="w-[23px] h-[23px] flex-shrink-0">
                  <SanitizedHTMLComponent html={partner.logo} />
                </div>
                <span className="font-medium text-sm leading-5 text-color-4 whitespace-nowrap">
                  {partner.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 5. Clean Up Unused Code

Once the dynamic implementation is working:

1. Remove the hardcoded `partnerDashboards` array from `MinimalHeader.tsx`
2. Remove `getPartnerLogo` function and individual logo components from `Icons.tsx`
3. Update or remove mock data in `app/components/TopNav/mocks/navData.ts` as needed for Storybook

## Handling Edge Cases

### No Partner Dashboards
```typescript
// The component already handles empty arrays gracefully
{partners.length > 0 && (
  // ... partner section only renders if there are partners
)}
```

### All Dashboards Hidden
If all dashboards have `showInTopNav: false`, the filtered array will be empty and the section won't render.

### Missing partnerDashboards Field
```typescript
// Use optional chaining and provide default empty array
const visibleDashboards = customization.partnerDashboards
  ?.filter(dashboard => dashboard.showInTopNav) || [];
```

## Testing Checklist

1. **Empty State**: Test with no partner dashboards from backend
2. **Mixed Visibility**: Test with some dashboards having `showInTopNav: true` and others `false`
3. **Current Dashboard Highlighting**: Navigate to different dashboard URLs and verify `isCurrent` styling
4. **SVG Rendering**: Verify all partner logos render correctly
5. **Fallback**: Test behavior when `partnerDashboards` is undefined
6. **Click Navigation**: Test that clicking partners navigates to `/#/{id}/dashboard`

## Storybook Updates

Update the stories to use SVG strings for testing:

```typescript
// app/components/TopNav/components/TopNav.stories.tsx
export const mockPartners: PartnerLink[] = [
  {
    name: "Lido",
    id: "lido",
    logo: '<svg width="23" height="23">...</svg>'  // Use actual SVG strings
  },
  // ... etc
];
```

## Migration Steps

1. **Phase 1 - Prepare**:
   - Add new types to customizationUtils
   - Update TopNav component to handle both old (icon name) and new (SVG string) formats

2. **Phase 2 - Deploy Backend**:
   - Backend deploys new API with `partnerDashboards` field

3. **Phase 3 - Switch to Dynamic**:
   - Update MinimalHeader to use dynamic data
   - Remove hardcoded arrays
   - Clean up unused icon components

## Notes for Developers

- **SVG Sanitization**: Use our existing pattern with DOMPurify + html-react-parser (NO dangerouslySetInnerHTML!)
- **No Caching Needed**: The customization data is already being fetched and managed
- **Extensible**: The `PartnerDashboard` interface can be extended with more fields in the future without breaking existing code
- **Performance**: Since we're already fetching customization data, there's no additional API call
- **Safety First**: The SanitizedSVG component follows the same safe pattern we use for other HTML content

## Example Response from Backend

```json
{
  "partnerName": "Example Partner",
  "partnerDashboards": [
    {
      "id": "lido",
      "name": "Lido",
      "logo": "<svg width=\"23\" height=\"23\" viewBox=\"0 0 23 23\">...</svg>",
      "showInTopNav": true
    },
    {
      "id": "verax",
      "name": "Verax",
      "logo": "<svg width=\"23\" height=\"23\" viewBox=\"0 0 23 23\">...</svg>",
      "showInTopNav": true
    }
    // ... more dashboards
  ]
}
```

## Questions?

If you encounter any issues or have questions during implementation, the key things to remember:
1. Features stay hardcoded (for now)
2. Partner dashboards become dynamic
3. SVG comes as strings, not component references
4. `isCurrent` is frontend logic based on URL params