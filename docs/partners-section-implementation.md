# Partners Section Implementation Plan

**Issue:** https://github.com/passportxyz/passport/issues/3757
**Branch:** `3489-embed-load-test` (or create new branch from main)

---

## Overview

Add a "Partners" section to the main Passport dashboard, displaying featured partner campaign cards. This section appears below the "Add Stamps" section and uses a horizontal scrolling carousel.

---

## Design Reference

The Figma design shows:
- 4 tall campaign cards in a horizontal row (Gitcoin, Verax, Lido, ZK Sync)
- Each card has a featured image, partner badge, header text, and subheader
- Pagination controls (arrows + dots) for carousel navigation
- "Explore all Partners" button

**Figma Node ID:** `20855:18506`

---

## Data Model

### Interface Definition

Create a clean interface for future API migration:

```typescript
// app/config/featuredCampaigns.ts

export interface FeaturedCampaign {
  id: string;                 // Unique identifier, used for routing
  partnerName: string;        // Display name in badge (e.g., "Gitcoin")
  partnerLogo: string;        // SVG string for the partner logo
  header: string;             // Main campaign text
  subheader: string;          // Secondary description text
  featuredImage: string;      // Imported static image asset
  destinationUrl: string;     // Click destination - internal or external URL
}
```

### Hardcoded Data

For now, campaigns are hardcoded. Later this can be swapped for an API call without changing components.

```typescript
// app/config/featuredCampaigns.ts

import gitcoinImage from "../assets/campaigns/gitcoin.png";
import veraxImage from "../assets/campaigns/verax.png";
import lidoImage from "../assets/campaigns/lido.png";
import zkSyncImage from "../assets/campaigns/zksync.png";

// Partner logo SVGs (extract from Figma or existing assets)
const GitcoinLogoSvg = `<svg>...</svg>`;
const VeraxLogoSvg = `<svg>...</svg>`;
const LidoLogoSvg = `<svg>...</svg>`;
const ZkSyncLogoSvg = `<svg>...</svg>`;

export const FEATURED_CAMPAIGNS: FeaturedCampaign[] = [
  {
    id: "gitcoin",
    partnerName: "Gitcoin",
    partnerLogo: GitcoinLogoSvg,
    header: "Header in one line",
    subheader: "Verify your activity based on days with active commits",
    featuredImage: gitcoinImage,
    destinationUrl: "/#/gitcoin/dashboard",  // Internal link example
  },
  {
    id: "verax",
    partnerName: "Verax",
    partnerLogo: VeraxLogoSvg,
    header: "Verify your activity based on days with active commits",
    subheader: "Small Header in one line",
    featuredImage: veraxImage,
    destinationUrl: "https://verax.example.com",  // External link example
  },
  // ... lido, zksync
];
```

---

## Component Structure

```
app/components/PartnersSection/
├── index.ts                    # Export barrel
├── PartnersSection.tsx         # Main section component
├── CampaignCard.tsx            # Individual campaign card
└── assets/                     # Campaign images (or put in app/assets/campaigns/)
    ├── gitcoin.png
    ├── verax.png
    ├── lido.png
    └── zksync.png
```

---

## Component Specifications

### 1. CampaignCard

A tall card with:
- **Full-bleed background image** with `object-cover`
- **Partner badge** (top-right): White pill with logo + partner name
- **Gradient overlay** (bottom): Dark gradient fading up
- **Header text**: White, medium weight, on gradient
- **Subheader text**: White/70% opacity, on gradient
- **Hover state**: Subtle scale or shadow effect
- **Aspect ratio**: `aspect-[4/5]` or similar to match Figma's tall proportions (~393px height at desktop width)

```tsx
// Pseudo-structure
<a href={destinationUrl} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noopener noreferrer" : undefined}>
  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
    {/* Background image */}
    <img src={featuredImage} className="absolute inset-0 w-full h-full object-cover" />

    {/* Partner badge - top right */}
    <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center gap-2">
      <div dangerouslySetInnerHTML={{ __html: partnerLogo }} />
      <span>{partnerName}</span>
    </div>

    {/* Gradient overlay + text - bottom */}
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
      <p className="text-white font-medium">{header}</p>
      <p className="text-white/70 text-sm">{subheader}</p>
    </div>
  </div>
</a>
```

### 2. PartnersSection

The full section containing:
- **Header**: "Partners" - matching the "Add Stamps" heading style
- **Horizontal scrolling container**: Cards scroll horizontally on all screen sizes
- **Grid columns**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **"Explore all Partners" button**: Bottom right, links to `https://google.com` for now (external, new tab)

---

## Link Behavior

Follow existing pattern from `app/components/WelcomeFooter.tsx:102-104`:

```typescript
// Helper to determine if URL is external
const isExternalUrl = (url: string): boolean => {
  return url.startsWith('http://') || url.startsWith('https://');
};

// In component
<a
  href={campaign.destinationUrl}
  target={isExternalUrl(campaign.destinationUrl) ? "_blank" : undefined}
  rel={isExternalUrl(campaign.destinationUrl) ? "noopener noreferrer" : undefined}
>
```

- **Internal links** (e.g., `/#/gitcoin/dashboard`): Same tab
- **External links** (e.g., `https://partner.com`): New tab with `rel="noopener noreferrer"`

---

## Responsive Behavior

### Grid Columns (matching existing pattern from `app/components/Category.tsx:109`)

| Breakpoint | Columns | Tailwind Class |
|------------|---------|----------------|
| Mobile | 1 | `grid-cols-1` |
| Tablet (md) | 2 | `md:grid-cols-2` |
| Desktop (lg) | 3 | `lg:grid-cols-3` |
| XL (xl) | 4 | `xl:grid-cols-4` |

### Horizontal Scroll

Even though we have a responsive grid, the section should support **horizontal scrolling** on smaller screens where not all cards fit. This allows testing the scroll behavior with just 4 cards.

```tsx
<div className="overflow-x-auto">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-max md:min-w-0">
    {campaigns.map(campaign => <CampaignCard key={campaign.id} {...campaign} />)}
  </div>
</div>
```

Alternative: Use flexbox with `flex-nowrap` for pure horizontal scroll:
```tsx
<div className="overflow-x-auto">
  <div className="flex gap-4 pb-4">
    {campaigns.map(campaign => (
      <div key={campaign.id} className="w-[280px] flex-shrink-0 md:w-[calc(50%-8px)] lg:w-[calc(33.33%-11px)] xl:w-[calc(25%-12px)]">
        <CampaignCard {...campaign} />
      </div>
    ))}
  </div>
</div>
```

---

## Integration Point

Add the PartnersSection below the "Add Stamps" section on the main dashboard.

Look at where the stamp categories are rendered and add `<PartnersSection />` after them.

Likely file: Search for where `Category` components are rendered, or where "Add Stamps" heading appears.

---

## Assets

### Campaign Images

Pull directly from Figma (node `20855:18506`) - these are the production assets:
- Gitcoin campaign image
- Verax campaign image
- Lido campaign image
- ZK Sync campaign image

Save to `app/assets/campaigns/` or `app/components/PartnersSection/assets/`.

### Partner Logos

Small logos shown in the badge. May already exist in codebase (check TopNav partner logos), otherwise extract from Figma.

---

## Styling Notes

### Theme Colors

Use theme tokens where possible (see `CLAUDE.md` for color reference):
- Background colors: `bg-background`, `bg-background-2`, etc.
- Text colors: `text-color-1`, `text-color-2`, etc.

For the campaign cards specifically:
- Badge background: White (`bg-white` or `bg-background`)
- Badge text: Dark (`text-color-4` which is black)
- Card text on gradient: White (`text-white` or `text-color-1`)

### Hover States

Use subtle hover effect:
```tsx
className="hover:scale-[1.01] hover:shadow-lg transition-all duration-200"
```

---

## Out of Scope (For Now)

1. **Floating navigation toggle** ("Prove Humanity" vs "Protected Campaigns") - mentioned in the GitHub issue but will be implemented separately later

2. **API/Backend integration** - data is hardcoded for now

3. **Django admin for campaigns** - not needed with hardcoded approach

4. **Image upload infrastructure** - assets are static imports

---

## Testing Considerations

1. **Horizontal scroll**: Verify scrolling works on mobile/tablet viewports
2. **Link behavior**: Test both internal and external links open correctly
3. **Responsive grid**: Check column counts at each breakpoint
4. **Image loading**: Ensure images display correctly with `object-cover`
5. **Hover states**: Verify hover effects work on desktop

---

## Files to Create/Modify

### New Files
- `app/config/featuredCampaigns.ts` - Interface + hardcoded data
- `app/components/PartnersSection/index.ts` - Export barrel
- `app/components/PartnersSection/PartnersSection.tsx` - Main component
- `app/components/PartnersSection/CampaignCard.tsx` - Card component
- `app/assets/campaigns/*.png` - Campaign images from Figma

### Modified Files
- Dashboard page component (TBD) - Add `<PartnersSection />` below Add Stamps

---

## Definition of Done

- [ ] `FeaturedCampaign` interface defined
- [ ] 4 campaigns hardcoded with Figma assets
- [ ] `CampaignCard` component renders correctly
- [ ] `PartnersSection` displays with "Partners" header
- [ ] Horizontal scrolling works on smaller screens
- [ ] Internal links stay in same tab
- [ ] External links open in new tab
- [ ] "Explore all Partners" button links to google.com (temporary)
- [ ] Section appears below "Add Stamps" on dashboard
- [ ] Responsive grid matches existing patterns (1/2/3/4 columns)
- [ ] Hover states work on cards
