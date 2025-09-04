# Provider Testing Patterns

## Testing VerifiedPayload Results

When testing providers that return `VerifiedPayload`, follow these patterns:

### Key Principles

1. **Don't over-specify the result shape**
   - The `record` field is ignored by consumers when `valid=false`
   - Don't check for absence/presence of `record` when testing failures

2. **Test what matters**
   - Check `valid` and `errors` separately
   - Focus on the actual validation logic, not the response shape

### Testing Patterns

#### Good Pattern
```typescript
// Test success and failure cases separately
expect(result.valid).toBe(false);
expect(result.errors).toEqual(["Expected error message"]);

// Or for success
expect(result.valid).toBe(true);
expect(result.record).toMatchObject({
  nullifier: expectedNullifier,
  // ... other expected fields
});
```

#### Bad Pattern
```typescript
// Too rigid - breaks if record field is present
expect(result).toEqual({ 
  valid: false, 
  errors: ["Error message"] 
});
```

### Why This Matters

- The IAM service ignores the `record` field when `valid=false`
- Providers may include partial `record` data even on failure
- Over-specifying tests makes them brittle without adding value

## Example Test Files
- `platforms/src/Biometrics/__tests__/biometrics.test.ts`
- `platforms/src/CleanHands/Providers/__tests__/cleanHands.test.ts`
- Any test file testing Provider implementations