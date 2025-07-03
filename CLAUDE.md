# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Gitcoin Passport is a monorepo using Lerna and Yarn workspaces. It provides identity verification through verifiable credentials.

### Key Packages:
- **app** - Next.js frontend application (React/TypeScript, Tailwind CSS, Chakra UI)
- **iam** - Express backend for credential issuance/verification
- **embed** - Service for embedding passport functionality
- **database-client** - Database connection layer (Ceramic Network support)
- **identity** - Helper package for DIDKit and identity functions
- **platforms** - Shared platform providers and verification logic
- **types** - Shared TypeScript definitions
- **embed-popup** - Vite-based UI for embedded experiences

## Prerequisites

- Node.js v16 LTS
- Yarn (managed by corepack)

## Global Commands

From the root directory:

```bash
# Install dependencies for all packages
lerna bootstrap

# Build all packages
yarn build

# Start development servers (app + iam concurrently)
yarn start

# Run all tests
yarn test

# Lint all packages
yarn lint

# Format code
yarn format

# Clean all packages
yarn clean

# Build specific package
yarn workspace @gitcoin/passport-app build
yarn workspace @gitcoin/passport-iam build
yarn workspace @gitcoin/passport-embed build
```

## Package-Specific Commands

### App (Frontend)
```bash
cd app/

# Development
yarn dev         # Start dev server on port 3000
yarn build       # Production build
yarn start:prod  # Run production build

# Testing (Vitest)
yarn test               # Run all tests
yarn test:watch         # Watch mode
yarn test:coverage      # Coverage report
yarn test:ci            # CI mode

# Run specific test file
yarn test components/Header.test.tsx
yarn test --run components/Header.test.tsx  # Single run

# Linting
yarn lint
yarn lint:fix
yarn format
```

### IAM Service
```bash
cd iam/

# Development
yarn dev     # Start on port 65535 with nodemon
yarn start   # Production start

# Testing (Jest)
yarn test                          # All tests
yarn test:watch                    # Watch mode
yarn test:coverage                 # Coverage
yarn test src/handlers/verify.test.ts  # Specific file

# Build
yarn build
yarn clean
```

### Embed Service
```bash
cd embed/

# Development
yarn dev     # Start with nodemon
yarn start   # Production start

# Testing (Jest)
yarn test                     # All tests
yarn test:watch               # Watch mode
yarn test src/server.test.ts  # Specific file

# Build
yarn build
```

## Running Individual Tests

### Vitest (App package)
```bash
# Run tests matching pattern
yarn test Button
yarn test components/Header

# Run tests in specific directory
yarn test components/

# Debug mode
yarn test --reporter=verbose
```

### Jest (IAM, Embed, etc.)
```bash
# Run single test file
yarn test path/to/test.ts

# Run tests matching pattern
yarn test --testNamePattern="should verify credential"

# Run tests in watch mode for specific file
yarn test:watch path/to/test.ts

# Update snapshots
yarn test -u
```

## Common Development Workflows

### Working on a feature across packages:
```bash
# 1. Make changes in platforms/
cd platforms/
yarn build

# 2. Test changes in app/
cd ../app/
yarn dev

# 3. Run affected tests
yarn test components/PlatformCard
```

### Pre-commit testing:
```bash
# From root - test all
yarn test

# Or test specific packages
yarn workspace @gitcoin/passport-app test:ci
yarn workspace @gitcoin/passport-iam test
```

### Debugging services:
```bash
# Run IAM with debugging
cd iam/
node --inspect yarn dev

# Check service logs
yarn dev 2>&1 | tee debug.log
```

## Environment Setup

Each service needs its own `.env` file based on `.env-example.env`. Critical variables:
- `NEXT_PUBLIC_PASSPORT_IAM_URL` - IAM service URL
- `NEXT_PUBLIC_SCORER_ENDPOINT` - Scorer API URL
- OAuth credentials for providers (Google, GitHub, Discord, etc.)
- RPC URLs for blockchain networks
- Feature flags for stamp providers

## Architecture Notes

- **Build Order**: platforms → identity → database-client → iam → embed → app
- **Testing**: Jest for backend services, Vitest for frontend
- **State Management**: React Context API with custom hooks
- **Styling**: Tailwind CSS with Chakra UI components
- **API Communication**: REST APIs with typed interfaces
- **Verification**: DIDKit for credential issuance, EAS for on-chain attestations

## Styling Guidelines

### Color System
Always use the theme-defined color tokens instead of hardcoded colors. The app uses a palette system with CSS custom properties accessible through Tailwind classes.

**Color Palette Reference (LUNARPUNK_DARK_MODE theme):**
- `background` → #F5F5F5 (light gray)
- `background-2` → #08205F (dark purple)
- `background-3` → #4A47D3 (iris)
- `background-4` → #122B33 (night blue)
- `background-5` → #FF8846 (orange)
- `foreground` → #FFFFFF (white)
- `foreground-2` → #C1F6FF (ice blue)
- `foreground-3` → #4B5F65 (iron gray)
- `foreground-4` → #6CB6AD (sea foam)
- `foreground-5` → #22645C (green)
- `foreground-6` → #074853 (turquoise)
- `foreground-7` → #D2DC95 (pale yellow)

**Text Colors:**
- `color-1` → #FFFFFF (white)
- `color-2` → #6CB6AD (sea foam)
- `color-3` → #D2D2D2 (light grey)
- `color-4` → #000000 (black)
- `color-5` → #4ABEFF (bright blue)
- `color-6` → #F5F5F5 (background/light)
- `color-7` → #FF8846 (orange)
- `color-8` → #A0FE7F (yellow green)
- `color-9` → #737373 (gray)
- `color-10` → #FEA57F (orange red)

**Other Theme Colors:**
- `focus` → #FF8846 (red/orange)

**Usage Examples:**
```tsx
// Correct - using theme colors with Tailwind classes
<div className="text-color-1 bg-background border-foreground-5">
  <p className="text-color-2">Secondary text in sea foam</p>
  <button className="bg-foreground-2 hover:bg-foreground-3">Ice blue button</button>
</div>

// Also correct when Tailwind doesn't support it
<div style={{ backgroundColor: "rgb(var(--color-background-2))" }}>

// Incorrect - hardcoded colors
<div className="text-gray-800 bg-white border-gray-200">
```

**Note:** All colors can be used with any Tailwind prefix (text-, bg-, border-, etc.). The theme system converts hex values to RGB format for CSS custom properties.

Always check existing components for color usage patterns before implementing new features.

### Stamp/Provider Architecture

The codebase uses a clean separation between platforms (frontend) and providers (backend):

#### Frontend (App)
- **Platform Classes**: Located in `platforms/src/{PlatformName}/App-Bindings.tsx`
  - Extend the base `Platform` class
  - Implement `getProviderPayload()` for authentication flows
  - Handle OAuth redirects, wallet connections, or custom flows
  - Can include banners for user instructions
- **GenericPlatform Component**: Universal UI for all stamps (`app/components/GenericPlatform.tsx`)
  - Handles standard OAuth popup flows
  - Manages stamp selection and verification
  - Sends verification requests to IAM service

#### Backend (IAM + Platforms)
- **Provider Classes**: Located in `platforms/src/{PlatformName}/Providers/{providerName}.ts`
  - Implement the `Provider` interface with `verify()` method
  - Take `RequestPayload` and return `VerifiedPayload`
  - Handle OAuth token exchange, API calls, or on-chain verification
- **Verification Flow**: IAM service coordinates verification
  - Receives signed challenge from frontend
  - Groups providers by platform
  - Calls each provider's `verify()` method
  - Issues Verifiable Credentials for successful verifications

#### Common Patterns
1. **OAuth Providers** (Discord, Google, LinkedIn):
   - Frontend: Generate OAuth URL, handle popup redirect
   - Backend: Exchange code for token, verify with provider API
2. **On-Chain Providers** (Civic, ETH, NFT):
   - Frontend: Use wallet connection, no OAuth
   - Backend: Query blockchain data directly
3. **Procedure-Based** (Twitter, BrightID):
   - Use `procedure-router` for complex server-side flows
   - Custom multi-step authentication

#### Key Files for Stamp Development
- `/platforms/src/platforms.ts` - Register new platforms
- `/app/config/platformMap.ts` - Frontend platform configuration
- `/platforms/src/{Platform}/Providers-config.ts` - UI metadata and grouping
- `/types/src/index.d.ts` - Type definitions for provider IDs

## Troubleshooting

- **Module not found**: Run `lerna bootstrap` from root
- **Type errors**: Rebuild packages with `yarn build`
- **Test failures**: Check if services are running (Redis, APIs)
- **Port conflicts**: Default ports are 3000 (app), 65535 (IAM), 80 (embed)

## Commit and Branch Conventions

- **Commit Messages**: Follow conventional commits spec loosely
  - Format: `feat/chore/etc(subpackage): message...`
- **Branch Names**: Start with issue number from passportxyz/passport
  - Example: `3526-bla-bla`
- **Pull Requests**:
  - Reference issue like "fixes #3526"
  - PR title should match the primary commit message