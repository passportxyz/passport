# Platform System Architecture

## Platform Identification System

Each platform in the codebase has multiple identifiers that serve different purposes:

### 1. Platform ID (Internal Key)
- Used in `platforms/src/platforms.ts` as object keys
- Used in Providers-config.ts as the 'platform' field
- Examples: `HumanIdKyc`, `HumanIdPhone`, `CleanHands`, `Github`, `Linkedin`
- **This is the canonical identifier for programmatic lookups**

### 2. Display Name
- Human-readable name shown in the UI
- Stored in Providers-config.ts as the 'name' field
- Examples: "Government ID", "Phone Verification", "Proof of Clean Hands", "GitHub", "LinkedIn"
- **Only for UI presentation, never for lookups**

### 3. Platform Class
- The actual class implementation in App-Bindings.tsx
- Implements the Platform interface with methods like `getProviderPayload()`

## Key Files
- `platforms/src/platforms.ts` - Platform registry with internal IDs as keys
- `platforms/src/*/Providers-config.ts` - Platform configurations with display names
- `embed/src/stamps.ts` - Stamp metadata with display names
- `embed/src/metadata.ts` - Service that needs to resolve platforms

## Best Practices
- Always use Platform IDs for lookups and programmatic access
- Use display names only for user-facing content
- Maintain consistency between platform IDs across all services