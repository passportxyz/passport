# Writing & Testing Providers

Conventions for `Provider.verify()` implementations and their tests.

## Error Philosophy

- **No try-catch at the top level of `verify()`.** Expected failures return `{ valid: false, errors: [...] }`; unexpected failures (network, SDK) throw and are caught higher up by the IAM service. Swallowing errors into generic `{valid: false}` kills debuggability.
- Examples following this: `platforms/src/CleanHands/Providers/index.ts`, `platforms/src/HumanID/shared/BaseHumanIdProvider.ts`, `platforms/src/CustomNFT/Providers/nftHolder.ts`.

## External Call Checklist

All four were caught in one code review of the CustomNFT provider:

1. **Timeout on every axios call** — `{ timeout: 10_000 }`. One hung call blocks `Promise.allSettled`.
2. **`encodeURIComponent` for user data in URLs** — path traversal otherwise (this bug existed in CustomGithub too).
3. **No silent fallback to defaults** — throw on unknown chainId/config rather than e.g. defaulting to mainnet.
4. **Track rejection counts from `Promise.allSettled`** — include `${rejected.length} checks failed` in errors.

## Error Flow Through the Stack

- `verifyTypes()` in `identity/src/verification.ts` catches provider errors per type; error strings truncated to 1000 chars (line ~159).
- `CredentialResponseBody` is `ValidResponseBody | ErrorResponseBody` (`types/src/index.d.ts`).
- `autoVerifyStamps` (`identity/src/autoVerification.ts`) returns `{ credentials, credentialErrors, timings }` — failures are mapped to `{provider, error, code}`, not dropped. The embed endpoints (`embed/src/handlers.ts`) include `credentialErrors` in responses.

## Testing VerifiedPayload

- Check `valid` and `errors` separately; on success use `toMatchObject` for `record`.
- Don't assert the full result shape (`toEqual({valid: false, errors: [...]})`) — `record` may be present on failure and is ignored by consumers when `valid=false`; over-specifying makes tests brittle.
- Reference tests: `platforms/src/Biometrics/__tests__/biometrics.test.ts`, `platforms/src/CleanHands/Providers/__tests__/cleanHands.test.ts`.

## AutoVerification Test Ordering

`getEvmProvidersByPlatform` returns providers **grouped by platform** (all of platform 1's providers, then platform 2's — never interleaved). Test expectations and error mappings in `identity/__tests__/autoVerification.test.ts` must follow that grouped order, not a flat success/fail set order.
