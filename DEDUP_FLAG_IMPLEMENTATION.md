# Deduplication Flag Implementation Summary

## Issue #3063 Requirements

The issue requests an enhanced visibility feature for stamps that have been claimed by another wallet address.

### Key Requirements:
- **User Story**: Users should understand when a stamp qualification exists but was claimed under a different wallet address
- **Acceptance Criteria**: Display an in-app label indicating that stamp qualification exists but was claimed under a different wallet address
- **Technical Details**: 
  - Implement an in-app label/tag for stamps that are qualified but previously claimed under a different wallet
  - To identify if the stamp is claimed on another wallet: check if the number of earned points for a stamp is 0, even though the stamp exists and is not expired
- **Open Question**: How should the in-app tag be designed to align with existing tags like "Verified" and "Expired"

## Changes Already Made in passport-scorer (3063-dedup-flag branch)

The passport-scorer API has been updated with the following changes:

### 1. API Response Schema Changes
- Changed from `GetStampsWithScoreResponse` to `GetStampsWithV2ScoreResponse` in ceramic-cache API
- Removed the old `DetailedScoreResponse` and replaced with `V2ScoreResponse`
- Added a new `V2StampScoreResponse` schema:
  ```python
  class V2StampScoreResponse(Schema):
      score: str
      dedup: bool  # This is the new deduplication flag
      expiration_date: Optional[str]
  ```

### 2. Score Response Format
- The `/score/{address}` endpoint now returns `V2ScoreResponse` which includes a `stamps` field
- The `stamps` field is a dictionary mapping provider IDs to `V2StampScoreResponse` objects
- Each stamp now has a `dedup` boolean flag indicating if it was deduplicated (claimed by another wallet)

### 3. API Endpoint Changes
- Updated various endpoints to use the new V2 response format
- The stamp information now includes the deduplication status

## Changes Needed in Passport Repo

### 1. Update Score Response Handling
- The app currently expects `stamp_scores` field but the new API returns `stamps` field
- Need to update `scorerContext.tsx` to handle the new response format with the `stamps` field containing objects with `score`, `dedup`, and `expiration_date`

### 2. Add Deduplication Label Display
- Create a new UI component/label for showing when a stamp is deduplicated
- This label should be displayed on stamp cards similar to how "Expired" labels are shown
- The label should appear when:
  - The stamp exists (is verified)
  - The stamp is not expired
  - The stamp has `dedup: true` in the response
  - The earned points are 0

### 3. Update Type Definitions
- Update TypeScript types to reflect the new API response structure
- Add the `dedup` field to stamp-related types

### 4. UI/UX Considerations
- The deduplication label should be visually distinct but consistent with existing labels
- Could use similar styling to the "Expired" label but with different text and possibly color
- The label text could be something like "Claimed by another wallet" or "Already claimed"

## Implementation Checklist

- [ ] Update `scorerContext.tsx` to handle new API response format
  - Change `response.data.stamp_scores` to `response.data.stamps` on lines 141 and 157
  - Update score extraction logic to handle object structure `{score: string, dedup: bool, expiration_date: Optional[str]}`
- [ ] Update TypeScript interfaces for the new response structure
  - Modify `StampScores` type to handle objects instead of strings
  - Add interface for new stamp response structure with `score`, `dedup`, and `expiration_date` fields
- [ ] Create deduplication label component
  - Add new `DedupedStamp` component in `PlatformCard.tsx` similar to `ExpiredStamp` (lines 195-270)
  - Use similar styling pattern but with text like "Claimed by another wallet"
- [ ] Add deduplication label to `PlatformCard.tsx`
  - Update stamp display logic (lines 297-339) to check for dedup status
  - Show dedup label when: verified, not expired, `dedup: true`, and score is 0
- [ ] Add deduplication label to other stamp display components as needed
  - Check for other components that display stamp status
- [ ] Test with deduplicated stamps to ensure proper display
- [ ] Look into backwards compatibility
  - Not super importand, would be max a few minutes downtime because we own both sides
  - If easy though, support a brief transition phase. But if it complicates the code, not worth it. Let me know what you decide here.

## Tests Created (12/6/2024)

### Files Created:
1. **`app/__tests__/context/scorerContext.test.tsx`** - New dedicated test file for scorerContext
   - Tests for handling both old (`stamp_scores`) and new (`stamps`) API response formats
   - Tests for extracting scores from objects containing `{score, dedup, expiration_date}`
   - Tests for backward compatibility with mixed formats
   - Tests for score calculations with deduplicated stamps
   - Tests for handling edge cases (missing stamps field, non-binary scorers)

2. **`app/__tests__/components/PlatformCard.test.tsx`** - New dedicated test file for PlatformCard
   - Tests for displaying deduplication label when appropriate
   - Tests for various scenarios: verified with points, verified without points (deduplicated), unverified
   - Tests for mixed provider scenarios where some are deduplicated
   - Tests ensuring expired stamps take precedence over deduplication status

### Files Modified:
1. **`app/__tests__/components/CardList.test.tsx`** - Added new test section
   - Added "deduplication label tests" describe block
   - Tests for showing/hiding deduplication label based on stamp status
   - Mock component tests to demonstrate expected UI behavior

### Important Implementation Notes:

1. **Context Storage Consideration**: The current `StampScores` type in scorerContext only stores score strings, not the full stamp objects. The implementation will need to decide how to pass the `dedup` flag from the API response to the UI components. Options include:
   - Store the full stamp response objects in context (breaking change)
   - Add a separate `stampDedupStatus` field to track dedup flags
   - Pass dedup information through a different mechanism

2. **Deduplication Detection Logic**: The tests assume deduplication is identified by:
   - Stamp exists (is verified)
   - Stamp has 0 earned points
   - API response has `dedup: true` for that stamp
   
   The actual implementation needs to ensure all three conditions are checked.

3. **Backward Compatibility**: Tests include handling of mixed format responses to support gradual migration, but the implementation should decide on the transition strategy based on deployment coordination between frontend and backend.

## Implementation Completed (12/6/2024)

### ✅ All Implementation Tasks Completed

The deduplication flag feature has been successfully implemented and is fully functional. All tests are passing and the code is ready for use.

### Final Implementation Approach

After reviewing the requirements and user feedback, the implementation took a **dual marker approach** instead of creating a separate deduplicated stamp type:

- **Verified stamps with deduplication** show both "Verified" and "Claimed by another wallet" markers
- **Expired stamps with deduplication** show both "Expired" and "Claimed by another wallet" markers
- **Normal stamps** continue to show only "Verified" or "Expired" as before

This approach maintains the existing stamp hierarchy (Expired > Verified > Default) while adding deduplication information as an additional marker.

### Files Implemented/Modified:

#### Core Changes:
1. **`app/context/scorerContext.tsx`**
   - Added new types: `StampScoreResponse`, `StampDedupStatus`
   - Updated `ScorerContextState` interface to include `stampDedupStatus`
   - Created `processStampScores()` helper function to handle both old and new API formats
   - Modified score loading logic to extract dedup information from API responses
   - Added backward compatibility for gradual migration
   - Fixed `calculatePlatformScore` dependencies to prevent stale closure issues

2. **`app/components/PlatformCard.tsx`**
   - Updated `StampProps` type to include `isDeduplicated?: boolean`
   - Modified `VerifiedStamp` and `ExpiredStamp` components to show dual markers
   - Added deduplication detection logic using provider-level checks
   - Updated stamp display logic to pass `isDeduplicated` prop
   - Added defensive programming for missing context data

#### Test Updates:
3. **`app/__tests__/context/scorerContext.test.tsx`**
   - Fixed axios mocking for weights endpoint
   - Added proper test coverage for new API format handling

4. **`app/__tests__/components/PlatformCard.test.tsx`**
   - Updated all tests to include proper `platformSpecs` mocking
   - Added `stampDedupStatus` to mock context
   - Created `createMockUsePlatforms()` helper function
   - Fixed test setup issues that were causing false failures

### Technical Details:

#### Deduplication Detection Logic:
```typescript
const isDeduplicated = providerIds.some((providerId) => {
  const isVerified = typeof allProvidersState[providerId]?.stamp?.credential !== "undefined";
  const isDeduped = (stampDedupStatus && stampDedupStatus[providerId]) || false;
  const hasZeroPoints = platform.earnedPoints === 0;
  return isVerified && isDeduped && hasZeroPoints;
});
```

#### API Response Processing:
- Handles new format: `response.data.stamps` with objects `{score, dedup, expiration_date}`
- Maintains backward compatibility with: `response.data.stamp_scores` with string values
- Gracefully handles mixed formats during transition period

#### UI Implementation:
- **Verified + Dedup**: Green "Verified" marker + Gray "Claimed by another wallet" marker
- **Expired + Dedup**: Orange "Expired" marker + Gray "Claimed by another wallet" marker
- **Spacing**: Uses `flex gap-2` for proper marker spacing

### Test Results:
- ✅ **All tests passing**: 211 passed, 5 skipped (216 total)
- ✅ **Lint passing**: Only pre-existing warnings remain
- ✅ **TypeScript**: No type errors
- ✅ **Formatting**: All code properly formatted

### Deployment Notes:
- **Backward Compatible**: Can deploy independently of backend changes
- **Graceful Degradation**: Falls back to old behavior if new API fields are missing
- **No Breaking Changes**: Existing functionality remains unchanged
- **Ready for Production**: All quality checks pass

### Key Features Delivered:
✅ Enhanced visibility for stamps claimed by other wallets  
✅ Clear visual distinction with "Claimed by another wallet" marker  
✅ Works for both verified and expired stamps  
✅ Maintains existing stamp hierarchy and behavior  
✅ Full backward compatibility during transition  
✅ Comprehensive test coverage  
✅ Production-ready implementation
