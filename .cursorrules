# Gitcoin Passport Monorepo - Cursor AI Rules

You are working with the Gitcoin Passport monorepo, a Lerna/Yarn workspace project for identity verification through verifiable credentials.

## Architecture Overview

This is a monorepo with these key packages:
- **app** - Next.js frontend (React/TypeScript, Tailwind CSS, Chakra UI)
- **iam** - Express backend for credential issuance/verification  
- **embed** - Service for embedding passport functionality
- **database-client** - Database connection layer (Ceramic Network)
- **identity** - Helper package for DIDKit and identity functions
- **platforms** - Shared platform providers and verification logic
- **types** - Shared TypeScript definitions
- **embed-popup** - Vite-based UI for embedded experiences

## Development Commands

### Root Level (always prefer these for consistency):
```bash
# Install dependencies
lerna bootstrap

# Build all packages (build order: platforms → identity → database-client → iam → embed → app)
yarn build

# Start development servers (app + iam concurrently)
yarn start

# Run all tests
yarn test

# Lint all packages
yarn lint

# Build specific package
yarn workspace @gitcoin/passport-app build
yarn workspace @gitcoin/passport-iam build
```

### Package-Specific Commands:
**App (Frontend):**
```bash
cd app/
yarn start         # Dev server on port 3000
yarn test          # Vitest tests
yarn test:watch    # Watch mode
```

**IAM Service:**
```bash
cd iam/
yarn debug         # Start on port 65535 with nodemon
yarn test          # Jest tests
```

**Embed Service:**
```bash
cd embed/
yarn debug         # Start with nodemon
yarn test          # Jest tests
```

## Code Guidelines

### Styling - CRITICAL: Always use theme colors, never hardcoded colors
The app uses a palette system with CSS custom properties. ALWAYS use theme-defined color tokens:

**Theme Colors (LUNARPUNK_DARK_MODE):**
- Background: `bg-background`, `bg-background-2`, `bg-background-3`, etc.
- Foreground: `bg-foreground`, `bg-foreground-2`, etc. 
- Text: `text-color-1`, `text-color-2`, etc.
- Focus: `focus` → #FF8846 (red/orange)

**CORRECT Usage:**
```tsx
<div className="text-color-1 bg-background border-foreground-5">
  <p className="text-color-2">Secondary text</p>
  <button className="bg-foreground-2 hover:bg-foreground-3">Button</button>
</div>
```

**WRONG - Never use hardcoded colors:**
```tsx
<div className="text-gray-800 bg-white border-gray-200"> // DON'T DO THIS
```

### Stamp/Provider Architecture

**Frontend (App):**
- Platform Classes: `platforms/src/{PlatformName}/App-Bindings.tsx`
- Extend base `Platform` class, implement `getProviderPayload()`
- GenericPlatform Component handles standard OAuth flows

**Backend (IAM + Platforms):**
- Provider Classes: `platforms/src/{PlatformName}/Providers/{providerName}.ts`  
- Implement `Provider` interface with `verify()` method
- Take `RequestPayload`, return `VerifiedPayload`

**Key Files for Stamp Development:**
- `/platforms/src/platforms.ts` - Register new platforms
- `/app/config/platformMap.ts` - Frontend platform configuration
- `/platforms/src/{Platform}/Providers-config.ts` - UI metadata
- `/types/src/index.d.ts` - Type definitions

## Testing Guidelines

- **Frontend (app)**: Uses Vitest
- **Backend services**: Uses Jest
- Always run tests after changes: `yarn test` from root
- For specific tests: `yarn test ComponentName` or `yarn test path/to/test.ts`

## Environment Setup

Each service needs `.env` file based on `.env-example.env`. Key variables:
- `NEXT_PUBLIC_PASSPORT_IAM_URL` - IAM service URL
- `NEXT_PUBLIC_SCORER_ENDPOINT` - Scorer API URL  
- OAuth credentials for providers
- RPC URLs for blockchain networks
- Feature flags for stamp providers

## Infrastructure Notes

- Uses dual ALB architecture (external vs internal services)
- External ALB: User-facing services (iam.passport.xyz, embed.passport.xyz)
- Internal ALB: Service-to-service communication (internal-alb.gitcoin.co)
- Secret management via AWS Secrets Manager and 1Password sync

## Common Issues & Solutions

- **Module not found**: Run `lerna bootstrap` from root
- **Type errors**: Rebuild packages with `yarn build`
- **Test failures**: Check if services are running (Redis, APIs)
- **Port conflicts**: Default ports are 3000 (app), 65535 (IAM), 80 (embed)

## Code Standards

- Follow conventional commits: `feat/chore(subpackage): message`
- Branch names start with issue number: `3526-feature-name`
- Use TypeScript strictly - no `any` types
- Prefer functional components with hooks
- Use React Context API for state management
- Always include proper error handling
- Write tests for new features

## When Making Changes

1. Understand the monorepo structure - changes in `platforms/` affect multiple services
2. Build dependencies in correct order if needed
3. Run relevant tests before committing
4. Check that both frontend and backend work together
5. Verify OAuth flows work end-to-end for stamp providers
6. Always use theme colors for styling
7. Follow the Platform/Provider architecture patterns

## Preferred File Locations

When creating new files, follow these conventions:
- New stamp platforms: `platforms/src/{PlatformName}/`
- Frontend components: `app/components/`
- Backend providers: `platforms/src/{PlatformName}/Providers/`
- Shared types: `types/src/index.d.ts`
- Configuration: `app/config/` or service-specific config folders 