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
