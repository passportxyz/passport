# Passport Scorer Customization API Architecture

## Overview
The passport-scorer Django backend implements partner dashboards and TopNav functionality through a centralized Customization model with dedicated API endpoints.

## Model Structure (models.py)

### Customization Model (lines 499-834)
Django model with OneToOneField to Community/Scorer, storing all dashboard customization fields.

### TopNav-Specific Fields (lines 615-628)
- `show_in_top_nav` (BooleanField): Whether dashboard appears in TopNav (default=False)
- `nav_order` (IntegerField): Display order - lower numbers appear first (default=0)
- `nav_logo` (TextField): Complete SVG logo string for TopNav display (nullable)

## API Endpoints (api.py)

### 1. GET /customization/ (lines 650-675)
**Purpose**: Fetch all available partner dashboards for TopNav discovery

**Returns**:
- `partnerDashboards` array with filtered dashboards (show_in_top_nav=True)
- `stampMetadata` for all stamps

**Filtering**: Orders by nav_order ASC, then partner_name ASC

**Response format per dashboard**:
- `id`: dashboard.path (used for routing)
- `name`: dashboard.partner_name (display name)
- `logo`: dashboard.nav_logo (complete SVG string)
- `showInTopNav`: boolean (always True since filtered)

### 2. GET /customization/{dashboard_path}/ (lines 678-770)
**Purpose**: Fetch full customization for a specific partner dashboard

**Includes**:
- All dashboard configuration (colors, logos, body text, etc.)
- `partnerDashboards` array (same as discovery endpoint)
- `stampMetadata` for available stamps
- Scoring weights and thresholds
- Custom stamps configuration

**TopNav dashboard format** (lines 699-711):
- Built from all Customization records where show_in_top_nav=True
- Ordered by nav_order, then partner_name
- Same response structure as discovery endpoint

## Response Structure Example

```json
{
  "key": "customization.path",
  "partnerName": "Partner Display Name",
  "customizationTheme": {"colors": {...}},
  "scorerPanel": {"title": "...", "text": "..."},
  "dashboardPanel": {
    "customDashboardPanelTitle": "...",
    "logo": "...",
    "body": "..."
  },
  "scorer": {"weights": {...}, "id": "...", "threshold": 0},
  "includedChainIds": [...],
  "showExplanationPanel": true,
  "customStamps": {...},
  "partnerDashboards": [
    {"id": "path", "name": "Display Name", "logo": "<svg>...</svg>", "showInTopNav": true}
  ],
  "stampMetadata": {...}
}
```

## Admin Interface (admin.py, lines 701-795)

### CustomizationAdmin Configuration
Fields organized in fieldsets including a TopNav Configuration section (lines 727-736):
- `show_in_top_nav`: Boolean checkbox
- `nav_order`: Integer field for ordering
- `nav_logo`: SVG text editor using AceWidget (svg mode)
- Section is collapsible with help text

### Form Customization (lines 673-683)
- SVG fields use AceWidget with syntax highlighting
- Other ReactNode fields use XML widget

## Data Migration

### migrations/0046_add_topnav_dashboard_fields.py
Adds the three TopNav fields to Customization model.

### migrations/0047_populate_topnav_dashboards.py
Populates initial partner dashboards:
- lido_csm (order 1)
- verax (order 2)
- shape (order 3)
- octant (order 4)
- recall (order 5)
- Includes complete SVG logos for each

## Key Implementation Details

1. **SVG Storage**: Logos stored as complete SVG strings in database (not URLs or component references)
2. **Pre-filtering**: Frontend receives pre-filtered, pre-ordered dashboards from backend
3. **Consistent Format**: Both discovery and detail endpoints return same partnerDashboards structure
4. **Routing**: Dashboard routing uses `path` field as unique identifier
5. **No Separate Campaign Model**: Featured campaigns are Customization records with show_in_top_nav=True

## Integration Points for New Features

### FeaturedCampaigns Pattern
Similar to partnerDashboards - could be implemented as:
- Top-level array in Customization response
- JSONField with campaign data per customization
- SVG logo pattern already established via nav_logo

## Related Files
- `/workspace/passport-scorer/api/account/models.py` - Customization model definition
- `/workspace/passport-scorer/api/account/api.py` - API endpoints
- `/workspace/passport-scorer/api/account/admin.py` - Django admin configuration
- `/workspace/passport-scorer/api/account/migrations/0046_add_topnav_dashboard_fields.py`
- `/workspace/passport-scorer/api/account/migrations/0047_populate_topnav_dashboards.py`
