# Deduplication Flag Implementation

## Overview

This document describes the implementation of the deduplication flag feature (Issue #3063) that provides enhanced visibility when stamps have been claimed by another wallet address. The implementation includes both backend API changes (in passport-scorer) and frontend UI updates (in passport app).

## Issue #3063 Requirements

### Key Requirements:
- **User Story**: Users should understand when a stamp qualification exists but was claimed under a different wallet address
- **Acceptance Criteria**: Display an in-app label indicating that stamp qualification exists but was claimed under a different wallet address
- **Technical Details**: 
  - Implement an in-app label/tag for stamps that are qualified but previously claimed under a different wallet
  - To identify if the stamp is claimed on another wallet: check if the number of earned points for a stamp is 0, even though the stamp exists and is not expired

## Backend Changes (passport-scorer)

The passport-scorer API has been updated to support deduplication flags:

### 1. API Response Schema Changes
- Added new V2 response format with simplified, flattened structure
- New `V2StampScoreResponse` schema:
  ```python
  class V2StampScoreResponse(Schema):
      score: str  # Decimal string with 5 decimal places (e.g., "10.00000")
      dedup: bool  # Boolean flag indicating if stamp was claimed by another wallet
      expiration_date: Optional[str]
  ```

### 2. V2 Score Response Format
The `/score/{address}` endpoint now returns a simplified structure:

**V2 Format:**
```json
{
  "address": "0x...",
  "score": "10.00000",
  "passing_score": true,
  "threshold": "20.00000",
  "stamps": {
    "Twitter": {
      "score": "5.00000",
      "dedup": false,
      "expiration_date": "2024-12-31T00:00:00Z"
    },
    "Github": {
      "score": "0.00000",
      "dedup": true,  // This stamp was claimed by another wallet
      "expiration_date": "2024-12-31T00:00:00Z"
    }
  }
}
```

**Key changes from legacy format:**
- Removed nested `status` and `evidence` fields
- All responses are now synchronous (no polling required)
- Scores are formatted as decimal strings with 5 decimal places
- Added `passing_score` boolean at root level
- Stamps are now objects instead of simple score strings

## Frontend Implementation (passport app)

### 1. Context State Management Refactoring

#### ScoreState Simplification
The score state management has been significantly simplified from multiple state types to a single discriminated union:

**Before:**
```typescript
export type PassportSubmissionStateType = "APP_INITIAL" | "APP_REQUEST_PENDING" | "APP_REQUEST_ERROR" | "APP_REQUEST_SUCCESS";
export type ScoreStateType = "APP_INITIAL" | "BULK_PROCESSING" | "PROCESSING" | "ERROR" | "DONE";
```

**After:**
```typescript
export type ScoreState = 
  | { status: "loading" } 
  | { status: "success" } 
  | { status: "error"; error: string };
```

This change eliminates the complexity of tracking submission state separately and removes the polling-related states that are no longer needed with the synchronous V2 API.

#### New Types Added
```typescript
// Individual stamp response from V2 API
export type StampScoreResponse = {
  score: string;
  dedup: boolean;
  expiration_date?: string;
};

// Maps provider IDs to deduplication status
export type StampDedupStatus = {
  [key in PROVIDER_ID]: boolean;
};

// V2 API response type
export type V2ScoreResponse = {
  address: string;
  score: string | null;
  passing_score: boolean;
  last_score_timestamp: string | null;
  expiration_timestamp: string | null;
  threshold: string;
  error: string | null;
  stamps: Record<string, StampScoreResponse> | null;
};
```

### 2. API Response Processing

#### processStampScores Function
A new helper function handles both V2 and legacy API formats:

```typescript
const processStampScores = (apiResponse: any): { 
  scores: Partial<StampScores>; 
  dedupStatus: Partial<StampDedupStatus> 
} => {
  const extractedScores: Partial<StampScores> = {};
  const extractedDedupStatus: Partial<StampDedupStatus> = {};

  // Process V2 format (stamps with objects)
  if (apiResponse.stamps) {
    for (const [providerId, stampData] of Object.entries(apiResponse.stamps)) {
      if (isStampObject(stampData)) {
        extractedScores[providerId as PROVIDER_ID] = stampData.score || "0";
        extractedDedupStatus[providerId as PROVIDER_ID] = stampData.dedup || false;
      }
    }
  }

  // Process legacy format (stamp_scores with strings)
  if (apiResponse.stamp_scores) {
    for (const [providerId, score] of Object.entries(apiResponse.stamp_scores)) {
      extractedScores[providerId as PROVIDER_ID] = String(score);
      extractedDedupStatus[providerId as PROVIDER_ID] = false; // Default for legacy
    }
  }

  return { scores: extractedScores, dedupStatus: extractedDedupStatus };
};
```

#### processScoreResponse Function
Handles the flattened V2 response structure and maintains backward compatibility:

```typescript
const processScoreResponse = (response: any) => {
  const data = response.data;
  
  // V2 format detection
  const isV2 = "passing_score" in data && !("status" in data);

  if (isV2) {
    // V2 format - simple, direct access
    return {
      score: parseFloatOneDecimal(data.score || "0"),
      rawScore: parseFloatOneDecimal(data.score || "0"),
      threshold: parseFloatOneDecimal(data.threshold || "0"),
      passingScore: data.passing_score ?? score >= threshold,
      scoreDescription: data.passing_score ? "Passing Score" : "Low Score",
      error: data.error || null,
    };
  } else {
    // Legacy format - handle evidence field and status
    // ... legacy processing logic
  }
};
```

### 3. UI Components Implementation

#### StampLabels Component (New)
A reusable component for displaying stamp status labels:

```tsx
export const StampLabels = ({ primaryLabel, primaryBgColor, isDeduplicated }: StampLabelsProps) => (
  <div className="flex gap-2">
    <div className={`${primaryBgColor} px-2 py-1 rounded text-right font-alt text-color-4`}>
      <p className="text-xs">{primaryLabel}</p>
    </div>
    {isDeduplicated && (
      <div className="bg-foreground-7 px-2 py-1 rounded text-right font-alt text-color-4">
        <p className="text-xs">Deduplicated</p>
      </div>
    )}
  </div>
);
```

#### useStampDeduplication Hook (New)
Custom hook to determine if a platform has deduplicated stamps:

```typescript
export const useStampDeduplication = (platform: PlatformScoreSpec): boolean => {
  const { allProvidersState } = useContext(CeramicContext);
  const { stampDedupStatus } = useContext(ScorerContext);
  const { platformProviderIds } = usePlatforms();

  return useMemo(() => {
    const providerIds = platformProviderIds[platform.platform] || [];
    return providerIds.some((providerId) => {
      const isVerified = typeof allProvidersState[providerId]?.stamp?.credential !== "undefined";
      const isDeduped = stampDedupStatus?.[providerId] || false;
      const hasZeroPoints = platform.earnedPoints === 0;
      return isVerified && isDeduped && hasZeroPoints;
    });
  }, [platform, allProvidersState, stampDedupStatus, platformProviderIds]);
};
```

#### Component Updates
- **PlatformCard**: Now checks for deduplication and passes `isDeduplicated` prop to stamp components
- **StampSelector**: Shows "Claimed by another wallet" label for individual deduplicated stamps
- **Notifications**: Added support for deduplication notification type

### 4. UI Design Approach

The implementation uses a **dual marker approach**:
- Stamps show their primary status (Verified/Expired) plus an additional "Deduplicated" label when applicable
- Both labels are displayed side-by-side with proper spacing
- Gray background color for deduplication labels to distinguish from primary status
- Consistent with existing UI patterns while adding new information

## Implementation Status

### ✅ Completed Features

1. **Context State Management**
   - Simplified ScoreState to a discriminated union (loading/success/error)
   - Added stampDedupStatus to ScorerContext
   - Implemented processStampScores and processScoreResponse helper functions
   - Full backward compatibility with legacy API format

2. **UI Components**
   - Created reusable StampLabels component
   - Created useStampDeduplication custom hook
   - Updated PlatformCard to show deduplication labels
   - Updated StampSelector for individual stamp deduplication display
   - Added deduplication notification support

3. **API Integration**
   - Handles both V2 (`stamps` with objects) and legacy (`stamp_scores` with strings) formats
   - Properly extracts deduplication flags from V2 responses
   - Graceful fallback for legacy format (dedup defaults to false)

### 🔄 Migration Notes

The implementation maintains full backward compatibility:
- Frontend can handle both old and new API formats simultaneously
- No breaking changes for existing functionality
- Can be deployed independently of backend changes
- Automatic format detection based on response structure

## Test Coverage

### Test Files Created/Updated:
1. **`app/__tests__/context/scorerContext.test.tsx`**
   - Tests for both V2 and legacy API response formats
   - Backward compatibility tests
   - Score calculation with deduplicated stamps
   - Edge case handling

2. **`app/__tests__/components/PlatformCard.test.tsx`**
   - Deduplication label display tests
   - Various stamp state scenarios
   - Mixed provider scenarios

3. **`app/__tests__/components/CardList.test.tsx`**
   - Added deduplication label tests
   - UI behavior verification

## Key Technical Details

### Deduplication Detection Logic
The implementation checks three conditions to determine if a stamp is deduplicated:
```typescript
const isVerified = typeof allProvidersState[providerId]?.stamp?.credential !== "undefined";
const isDeduped = stampDedupStatus?.[providerId] || false;
const hasZeroPoints = platform.earnedPoints === 0;
return isVerified && isDeduped && hasZeroPoints;
```

### Simplified Polling Removal
The V2 API eliminates the need for polling since all responses are synchronous. The legacy polling logic is maintained only for backward compatibility and can be removed once the backend fully migrates.

## Planned Enhancements

### 1. Point Value Display Improvements
Update point values to display "0" (string) instead of "0.0" when stamps are deduplicated:

**Implementation Approach:**
- Create new utility function `formatPointsDisplay()` alongside existing `parseFloatOneDecimal()`
- Keep existing `parseFloatOneDecimal()` for business logic (on-chain status, score calculations)
- Add new display utility for UI formatting with deduplication awareness:
  ```typescript
  export const formatPointsDisplay = (
    points: number, 
    isDeduplicated: boolean = false, 
    decimals: number = 1
  ): string => {
    if (isDeduplicated && points === 0) {
      return "0";
    }
    return points.toFixed(decimals);
  };
  ```

**Target Components:**
- **PlatformCard.tsx**: Platform-level point displays (available/earned points)
- **PlatformDetails.tsx**: Detailed points breakdown
- **StampSelector.tsx**: Individual stamp point weights
- **DashboardScorePanel.tsx**: Main score display (if needed)

### 2. Clickable Deduplication Links
Make both deduplication badges clickable links to support documentation:

**Target Components:**
- **StampLabels.tsx**: "Deduplicated" badge
- **StampSelector.tsx**: "Claimed by another wallet" label

**Implementation:**
- Wrap deduplication labels in anchor tags with:
  - `href="https://support.passport.xyz/passport-knowledge-base/common-questions/why-am-i-receiving-zero-points-for-a-verified-stamp"`
  - `target="_blank"`
  - `rel="noopener noreferrer"`
- Maintain existing visual design while adding link functionality
- Add appropriate cursor and hover states

## Summary

The deduplication flag implementation successfully provides enhanced visibility when stamps have been claimed by another wallet. The feature is production-ready with:
- Full backward compatibility during API migration
- Clear visual feedback through dual marker approach
- Comprehensive test coverage
- No breaking changes to existing functionality

**Planned enhancements** will improve user experience by showing cleaner point displays ("0" vs "0.0") and providing direct access to support documentation through clickable deduplication badges.
