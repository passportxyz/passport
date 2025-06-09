# Platforms Package - Developer Guide

This package contains all the stamp provider implementations for Gitcoin Passport.

## Structure

Each platform follows a consistent structure:

```
platforms/src/{PlatformName}/
├── index.ts                    # Main exports
├── App-Bindings.tsx           # Frontend platform class
├── Providers-config.ts        # UI configuration
├── Providers/                 # Backend provider implementations
│   ├── index.ts
│   └── {providerName}.ts
└── __tests__/                 # Test files
    └── {providerName}.test.ts
```

## Creating a New Platform

### 1. Directory Structure

Create the directory structure above in `src/{PlatformName}/`.

### 2. Backend Provider (`Providers/{providerName}.ts`)

Implement the `Provider` interface:

```typescript
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderOptions } from "../../types.js";

export class YourProvider implements Provider {
  type = "YourProviderName";

  constructor(options: ProviderOptions = {}) {
    // Initialize provider
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      // Your verification logic here
      // Return { valid: true, record: {...} } or { valid: false, errors: [...] }
    } catch (error) {
      throw new ProviderExternalVerificationError(`Error: ${error}`);
    }
  }
}
```

### 3. Frontend Platform (`App-Bindings.tsx`)

Extend the `Platform` class:

```typescript
import { Platform } from "../utils/platform.js";
import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";

export class YourPlatform extends Platform {
  platformId = "YourPlatform";
  path = "YourPlatform";
  isEVM = false; // Set to true if requires wallet connection

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    // Handle authentication flow
    // For OAuth: use appContext.waitForRedirect
    // For on-chain: return wallet-related data
    // For custom: implement your flow
  }

  // Optional: Add user instructions
  banner = {
    heading: "Instructions for users",
    content: <div>Explanation of verification process</div>,
    cta: {
      label: "External Link",
      url: "https://example.com"
    }
  };
}
```

### 4. Configuration (`Providers-config.ts`)

Define UI metadata:

```typescript
export const YourProviderConfig = {
  PlatformDetails: {
    icon: "./assets/yourPlatformIcon.svg",
    platform: "YourPlatform",
    name: "Your Platform Name",
    description: "Brief description",
    connectMessage: "Connect your account to verify",
  },
  ProviderConfig: [
    {
      title: "Verification Category",
      description: "Category description",
      providers: [
        {
          title: "Provider Display Name",
          description: "What this provider verifies",
          name: "YourProviderName",
        },
      ],
    },
  ],
};
```

### 5. Main Export (`index.ts`)

```typescript
export { YourPlatform } from "./App-Bindings";
export { YourProviderConfig } from "./Providers-config";
export { providers } from "./Providers";
```

### 6. Provider Export (`Providers/index.ts`)

```typescript
import { YourProvider } from "./yourProvider.js";

export const providers = [new YourProvider()];
```

## Common Provider Patterns

### OAuth Flow

1. Frontend generates OAuth URL via `getOAuthUrl()`
2. User redirected to OAuth provider
3. Frontend waits for redirect with authorization code
4. Backend exchanges code for access token
5. Backend verifies user data via provider API

### On-Chain Verification

1. Frontend connects wallet (`isEVM = true`)
2. Backend queries blockchain data
3. Verification based on on-chain state

### Custom Flows

1. Frontend implements custom authentication
2. Can use wagmi hooks for wallet interactions
3. Can use iframe integration or external services

## Testing

Create tests in `__tests__/{providerName}.test.ts`:

```typescript
import { YourProvider } from "../Providers/yourProvider";
import { RequestPayload } from "@gitcoin/passport-types";

describe("YourProvider", () => {
  let provider: YourProvider;

  beforeEach(() => {
    provider = new YourProvider();
  });

  it("should verify valid proof", async () => {
    const payload: RequestPayload = {
      address: "0x...",
      proofs: { code: "valid_code" },
      type: "YourProviderName",
      version: "0.0.0",
    };

    const result = await provider.verify(payload);
    expect(result.valid).toBe(true);
  });
});
```

## Integration

1. Add to `/platforms/src/platforms.ts`:

```typescript
import {
  YourPlatform,
  YourProviderConfig,
  providers as YourProviders,
} from "./YourPlatform";

export const Platforms = new Map([
  // ... existing platforms
  ["YourPlatform", YourPlatform],
]);

export const PlatformDetails = {
  // ... existing configs
  YourPlatform: YourProviderConfig.PlatformDetails,
};

export const ProviderConfig = {
  // ... existing configs
  YourPlatform: YourProviderConfig.ProviderConfig,
};

export const providers = [
  // ... existing providers
  ...YourProviders,
];
```

2. Add to app configuration in `/app/config/platformMap.ts`

3. Add types to `/types/src/index.d.ts` if needed

## Key Dependencies

- `@gitcoin/passport-types` - Core type definitions
- `axios` - HTTP requests for API calls
- Platform-specific SDKs as needed

## Best Practices

1. **Error Handling**: Use `ProviderExternalVerificationError` for external API failures
2. **Testing**: Mock external APIs and test edge cases
3. **Security**: Validate all inputs, never log sensitive data
4. **Performance**: Cache provider instances, avoid unnecessary API calls
5. **UI/UX**: Provide clear instructions and error messages

## Special Considerations

### Wallet Integration

- Set `isEVM = true` for providers requiring wallet connection
- Use wagmi hooks in frontend for signature/transaction handling
- Validate addresses and handle network switching

### Rate Limiting

- Be mindful of external API rate limits
- Implement appropriate backoff strategies
- Cache responses when possible

### Privacy

- Never log user credentials or tokens
- Follow each platform's data usage policies
- Implement proper data retention practices
