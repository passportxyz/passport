# Credential Verification Error Handling Architecture

## Overview
The credential verification flow captures errors at multiple layers but currently only returns successful credentials to clients, filtering out failures.

## Error Flow Through Layers

### 1. Identity Layer (verification.ts)
- **Function**: `verifyTypes()`
- **Error Handling**:
  - Catches provider errors and stores them in `VerifyTypeResult`
  - Errors truncated to 1000 chars: `error = resultErrors?.join(", ")?.substring(0, 1000)`
  - Returns array of results with error/code fields for failed verifications

### 2. Auto Verification (autoVerification.ts)
- **Current Behavior**: Only returns successful credentials
- **Implementation**:
  - Uses `verifyProvidersAndIssueCredentials()` returning `CredentialResponseBody[]`
  - Filters results to only include valid credentials with `.filter()`
  - **Issue**: Error information is lost in the filtering process

### 3. Embed Service (handlers.ts)
- **`/embed/verify` endpoint**:
  - Gets credentials but only passes successful ones to scorer
- **`/embed/auto-verify` endpoint**:
  - Calls `autoVerifyStamps()` which only returns successful stamps
- **Issue**: Neither endpoint currently exposes credential errors to the client

## Type Structures

### VerifiedPayload
- Has optional `errors?: string[]` field for provider-level errors

### CredentialResponseBody
- Union type: `ValidResponseBody | ErrorResponseBody`
- **ErrorResponseBody**: Contains `error: string` and `code: number`

## Key Problem
Error information is captured at the verification layer but lost when filtering for successful credentials, preventing clients from understanding why certain verifications failed.

## Related Files
- `identity/src/verification.ts` - Core verification logic
- `identity/src/autoVerification.ts` - Auto-verification filtering
- `embed/src/handlers.ts` - Embed service endpoints
- `types/src/index.d.ts` - Type definitions