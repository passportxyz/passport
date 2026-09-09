# TopNav & Partner Customization

TopNav shows hardcoded product features plus partner dashboards fetched dynamically via the customization API.

## Data Flow

- Backend: passport-scorer's `Customization` Django model (one per Community/Scorer) with `show_in_top_nav`, `nav_order`, `nav_logo` fields; endpoints `GET /customization/` (discovery) and `GET /customization/{path}/` (full config). Backend pre-filters (`show_in_top_nav=True`) and pre-orders (`nav_order`, then name).
- Frontend fetch + prep: `requestCustomizationConfig` in `app/utils/customizationUtils.tsx`. The response carries a top-level `partnerDashboards: {id, name, logo, showInTopNav}[]`.
- `dashboard.id` is the routing key: partner dashboards route to `/#/{id}/dashboard`.

## Data Preparation Pattern

Filtering/transforming happens once in the data layer, not in components: `customizationUtils.tsx` derives `topNavDashboards` (filtered on `showInTopNav`, `isCurrent` set by comparing `dashboard.id` to the current customization key). Components (`app/components/TopNav/components/TopNav.tsx`, `app/components/MinimalHeader.tsx`) consume ready-to-use data. Follow this pattern when adding customization-driven features (e.g. featured campaigns).

## SVG Logos

- Stored as complete SVG strings in the scorer DB (not URLs) — new partners need no frontend deploy
- Rendered via `SanitizedHTMLComponent` (DOMPurify) in `TopNav.tsx`
- Edge cases handled: empty/undefined `partnerDashboards` → features-only nav

## Known Wart

`app/components/NavPopover.tsx` hardcodes panel widths (479 compact / 737 full) — can overflow on small screens.
