# Frontend Handoff: Stamp Metadata & Beta Badge Support

## Overview

We've added stamp metadata tracking to enable displaying beta badges on stamps in the UI. This is **Phase 1** of a two-phase implementation that provides the foundation for stamp metadata management.

## What Changed

### Backend Changes

#### New Database Model: `StampMetadata`
- **Location**: `api/registry/weight_models.py`
- **Table**: `registry_stampmetadata`
- **Purpose**: Tracks global metadata for stamp providers (currently focused on beta status)

**Fields**:
- `provider` (string): The provider name that matches the stamp provider field
- `is_beta` (boolean): Whether this stamp should display a beta badge

#### API Response Updates

Both customization endpoints now include a new `stampMetadata` field:

1. **Dashboard Discovery Endpoint**: `GET /account/customization/`
2. **Specific Dashboard Endpoint**: `GET /account/customization/{dashboard_path}/`

## API Response Structure

### New Field: `stampMetadata`

Both endpoints now return a `stampMetadata` object at the top level:

```json
{
  "partnerDashboards": [...],
  "customStamps": [...],
  // ... other existing fields ...

  "stampMetadata": {
    "Google": {
      "isBeta": true
    },
    "Github": {
      "isBeta": false
    },
    "Twitter": {
      "isBeta": true
    }
    // ... more providers
  }
}
```

### Structure Details

- **Key**: Provider name (string) - matches the `provider` field on stamps
- **Value**: Object with metadata properties
  - `isBeta` (boolean): Whether to display a beta badge for this stamp

## Frontend Implementation Guide

### 1. Accessing Stamp Metadata

When you fetch customization data, you'll now have access to `stampMetadata`:

```typescript
interface StampMetadata {
  isBeta: boolean;
}

interface CustomizationResponse {
  // ... existing fields
  stampMetadata: Record<string, StampMetadata>;
}

// Usage
const response = await fetchCustomization();
const isBeta = response.stampMetadata["Google"]?.isBeta ?? false;
```

### 2. Displaying Beta Badges

You can now conditionally show beta badges based on the provider:

```typescript
function StampCard({ provider, ...props }) {
  const metadata = useCustomization().stampMetadata;
  const isBeta = metadata[provider]?.isBeta ?? false;

  return (
    <div className="stamp-card">
      {/* Stamp content */}
      {isBeta && <BetaBadge />}
    </div>
  );
}
```

### 3. Handling Missing Metadata

**Important**: Not all stamps will have metadata entries initially. Always provide a fallback:

```typescript
// ✅ Good - safe access with fallback
const isBeta = stampMetadata[provider]?.isBeta ?? false;

// ❌ Bad - will throw error if provider not found
const isBeta = stampMetadata[provider].isBeta;
```

## Admin Interface

Product/ops team can now manage stamp metadata via Django Admin:

- **URL**: `/admin/registry/stampmetadata/`
- **Features**:
  - List view shows all providers with their beta status
  - Inline editing of `is_beta` flag
  - Search by provider name
  - Filter by beta status

## Migration Notes

### Current State (Phase 1)
- `stampMetadata` is now available in API responses
- Metadata entries are created manually via Django Admin
- Not all stamps have metadata entries yet

### Future (Phase 2)
- Data migration will populate metadata for all existing stamps
- The relationship between `WeightConfigurationItem` and `StampMetadata` will become required
- All stamps will have guaranteed metadata

## Testing

### Test Scenarios

1. **Stamps with beta metadata**: Should display beta badge
2. **Stamps without metadata**: Should display normally (no badge)
3. **API response validation**: Verify `stampMetadata` exists in both endpoints
4. **Empty metadata**: Handle case where `stampMetadata` is an empty object

### Example Test Data

To test beta badges locally, you can add metadata via Django Admin or Django shell:

```python
from registry.weight_models import StampMetadata

# Create beta stamps
StampMetadata.objects.create(provider="Google", is_beta=True)
StampMetadata.objects.create(provider="Twitter", is_beta=True)
StampMetadata.objects.create(provider="Github", is_beta=False)
```

## Backward Compatibility

- ✅ **Fully backward compatible**: Existing frontend code will continue to work
- ✅ **Additive only**: We only added a new field, didn't change existing ones
- ✅ **Optional handling**: Frontend can choose to display badges or ignore the metadata

## Questions & Support

**Backend contacts**: Lucian Hymer (@lucian)

**Related files**:
- Backend model: `api/registry/weight_models.py`
- API endpoint: `api/account/api.py`
- Admin interface: `api/registry/admin.py`
- Database migration: `api/registry/migrations/0059_add_stamp_metadata.py`

## Next Steps for Frontend

1. **Update TypeScript types** to include `stampMetadata` field
2. **Design beta badge component** (if not already designed)
3. **Implement badge display logic** in stamp components
4. **Add tests** for beta badge display
5. **Coordinate with product** on which stamps should be marked as beta

---

**Commits**:
- Phase 1: `9c969670` - Add stamp metadata model and beta badge support
- Endpoint update: `321d26f0` - Add stampMetadata to generic customization endpoint

**Branch**: `3800-beta-stamps`
