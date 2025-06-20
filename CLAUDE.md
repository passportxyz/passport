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

- Node.js v20 LTS
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