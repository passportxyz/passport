# V2 API Response Format Tests Summary

## What was implemented:

### 1. Helper Functions
Added two helper functions to create test responses:
- `createV2Response()` - Creates V2 format responses with flat structure
- `createLegacyResponse()` - Creates legacy format responses with nested structure

### 2. New V2 Format Tests
Added comprehensive tests for the V2 API response format:

1. **Basic V2 format handling**
   - Tests passing_score boolean field
   - Tests threshold at root level
   - Tests score as decimal string with 5 places
   - Tests absence of status field

2. **Edge cases**
   - V2 format with null score
   - V2 format with deduplicated stamps
   - V2 format with expiration_timestamp
   - V2 format with empty stamps
   - V2 format missing required fields

3. **Backward compatibility**
   - Tests that both V2 and legacy formats can be handled
   - Tests format detection by absence of status field
   - Tests decimal format conversion for display

### 3. Test Status
All V2 format tests are currently **FAILING** as expected, since the implementation hasn't been updated yet. The tests are ready to pass once the scorerContext implementation is updated to handle:

1. Detection of V2 format (no status field)
2. Parsing of flat structure (no evidence object)
3. New fields: passing_score, expiration_timestamp, error
4. Score format with 5 decimal places

### 4. Missing Context Properties
The tests revealed that these properties need to be added to the ScorerContext:
- `passingScore: boolean`
- `expirationDate: string | null`
- `scoreLoaded: boolean`
- `error: string | null`

These will need to be added to the `ScorerContextState` interface when implementing the V2 format support.