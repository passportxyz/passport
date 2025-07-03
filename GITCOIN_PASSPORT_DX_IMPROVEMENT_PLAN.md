# Gitcoin Passport DX Improvement Plan

## Executive Summary

This document outlines a plan to dramatically improve the developer experience for Gitcoin Passport frontend development. The main pain point is the complex authentication flow requiring MetaMask/wallet connection and multiple API integrations, making it difficult to iterate on UI changes quickly. Our solution uses Mock Service Worker (MSW) and a development mode to enable instant UI development without authentication.

## Implementation Status

### ✅ Phase 1: Core Infrastructure - COMPLETE
- MSW installed and configured
- Basic mock handlers for all major endpoints
- Dev mode authentication bypass implemented
- Environment variable configuration working

### ✅ Phase 2: Mock Data System - COMPLETE
- ✅ Stamp generator functions built
- ✅ Scenario management system created
- ✅ Nullifier generation implemented
- ✅ EIP712 mock signatures (basic implementation)
- ✅ Mock score endpoint returns proper stamp_scores data

### 🚧 Phase 3: Developer Tools - IN PROGRESS
- ✅ DevPanel component built
- ✅ Scenario dropdown functional
- ✅ Scenario persistence with localStorage
- ⏳ Dynamic scenario switching needs refinement
- ⏳ Playwright helpers pending

### 📅 Phase 4: Documentation & Rollout - PENDING

## Current Pain Points

1. **Complex Authentication Flow**
   - Must connect wallet (MetaMask/WalletConnect)
   - Create DID session with Ceramic database
   - Sign EIP712 challenges for every action
   - Multiple external service dependencies

2. **Scattered State Management**
   - Multiple React Contexts with interdependencies
   - DatastoreConnectionContext → CeramicContext → ScorerContext
   - Complex provider wrapping hierarchy

3. **External Service Dependencies**
   - Ceramic Cache API (passport storage)
   - IAM Service (credential issuance)
   - Scorer Service (score calculation)
   - Each requires authentication

## Proposed Solution: MSW + Dev Mode

### Overview

Implement a hybrid approach using Mock Service Worker (MSW) to intercept API calls and a dev mode flag to bypass wallet authentication. This enables:
- Instant UI development without MetaMask
- Playwright/automated testing support
- Rapid iteration on stamp flows
- Zero impact on production code

### Key Components

#### 1. Mock Service Worker Setup

MSW intercepts network requests at the browser level and returns mock responses:

```typescript
// app/mocks/handlers.ts
import { rest } from 'msw'
import { generateMockStamp, generateMockScore } from './generators'

export const handlers = [
  // Skip wallet authentication
  rest.post('*/ceramic-cache/authenticate', (req, res, ctx) => {
    return res(ctx.json({
      did: 'did:pkh:eip155:1:0xDEV123...',
      token: 'mock-access-token',
      expiresAt: Date.now() + 86400000
    }))
  }),

  // Mock passport data
  rest.get('*/ceramic-cache/stamp', (req, res, ctx) => {
    const address = req.url.searchParams.get('address')
    return res(ctx.json({
      success: true,
      passport: {
        issuanceDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 90*24*60*60*1000).toISOString(),
        stamps: getMockStampsForScenario()
      }
    }))
  }),

  // Mock stamp verification
  rest.post('*/api/v0.0.0/verify', (req, res, ctx) => {
    const { type } = req.body
    return res(ctx.json({
      credential: generateMockStamp(type),
      record: { challenge: mockChallenge },
      signature: '0xmocked...',
      error: null
    }))
  }),

  // Mock scoring
  rest.get('*/ceramic-cache/score/*', (req, res, ctx) => {
    return res(ctx.json({
      status: 'DONE',
      score: '42.50000',
      individual_scores: mockStamps.map(s => ({
        name: s.provider,
        value: '1.5'
      }))
    }))
  })
]
```

#### 2. Dev Mode Authentication Bypass

```typescript
// app/components/DevModeProvider.tsx
export const DevModeProvider = ({ children }) => {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return children
  }

  // Mock wallet state
  const mockAccount = {
    address: '0xDEV123...',
    isConnected: true,
  }

  // Pre-authenticated state
  const mockDbState = {
    connected: true,
    dbAccessToken: 'mock-token',
    did: 'did:pkh:eip155:1:0xDEV123...'
  }

  return (
    <MockDatastoreConnectionContext.Provider value={mockDbState}>
      <MockWagmiProvider account={mockAccount}>
        {children}
      </MockWagmiProvider>
    </MockDatastoreConnectionContext.Provider>
  )
}
```

#### 3. Mock Data Generators

Based on analysis of real passport data, stamps must include:

```typescript
// app/mocks/generators.ts
export function generateMockStamp(provider: string): VerifiableCredential {
  const issuanceDate = new Date().toISOString()
  const expirationDate = new Date(Date.now() + 90*24*60*60*1000).toISOString()
  
  return {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/vc/status-list/2021/v1"
    ],
    type: ["VerifiableCredential"],
    credentialSubject: {
      id: "did:pkh:eip155:1:0xDEV123...",
      provider,
      nullifiers: [
        `v0.0.0:${generateNullifier()}`,
        `v1:${generateNullifier()}`
      ],
      "@context": {
        nullifiers: {
          "@container": "@list",
          "@type": "https://schema.org/Text"
        },
        provider: "https://schema.org/Text"
      }
    },
    issuer: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e",
    issuanceDate,
    expirationDate,
    proof: {
      "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
      type: "EthereumEip712Signature2021",
      proofPurpose: "assertionMethod",
      proofValue: "0xmocked...",
      verificationMethod: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e#controller",
      created: issuanceDate,
      eip712Domain: {
        domain: { name: "VerifiableCredential" },
        primaryType: "Document",
        types: { /* EIP712 type definitions */ }
      }
    }
  }
}
```

#### 4. Developer Control Panel (Simplified)

```typescript
// app/components/DevPanel.tsx
import scenarios from '../mocks/scenarios.json'

export const DevPanel = () => {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') return null

  const [currentScenario, setCurrentScenario] = useState('new-user')

  const loadScenario = (scenarioName: string) => {
    setCurrentScenario(scenarioName)
    // MSW will use this to determine which data to return
    window.__mockScenario = scenarioName
    // Force re-render to load new data
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background-2 p-4 rounded-lg shadow-lg z-50">
      <h3 className="text-color-1 font-bold mb-2">Dev Mode</h3>
      
      <select 
        value={currentScenario}
        onChange={(e) => loadScenario(e.target.value)}
        className="w-full px-3 py-2 bg-background text-color-1 rounded"
      >
        {Object.keys(scenarios).map(name => (
          <option key={name} value={name}>
            {scenarios[name].description || name}
          </option>
        ))}
      </select>
      
      <div className="mt-2 text-xs text-color-3">
        Scenario: {currentScenario}
      </div>
    </div>
  )
}
```

### Test Scenarios

Pre-built scenarios stored in a JSON file for easy modification:

```json
// app/mocks/scenarios.json
{
  "new-user": {
    "description": "New User - Empty Passport",
    "stamps": [],
    "score": 0,
    "expirationDate": null
  },
  "basic-user": {
    "description": "Basic User - Few Stamps",
    "stamps": ["Google", "Discord", "Github"],
    "score": 15.5,
    "expirationDate": "2024-04-15T00:00:00.000Z"
  },
  "power-user": {
    "description": "Power User - 50+ Stamps",
    "stamps": [
      "Google", "Discord", "Github", "Linkedin",
      "NFT", "ETHBalance", "FirstEthTxnProvider",
      "GnosisSafe", "Snapshot", "ENS", "POH",
      "BrightId", "Civic", "CyberConnect", "Lens",
      "TwitterAccountAgeGte365Days", "TwitterFollowerGT500",
      "FacebookFriends", "InstagramFollowers",
      "TrustaLabs", "GuildMember", "GuildAdmin",
      "GrantsContributor", "GrantsGrantee",
      "EthGasSpent", "EthTransactions", "ZkSyncBalance",
      // ... more stamps for 50+ total
    ],
    "score": 85.5,
    "expirationDate": "2024-04-15T00:00:00.000Z"
  },
  "expired-stamps": {
    "description": "Expired Stamps - Mixed States",
    "stamps": [
      { "provider": "Google", "expirationDate": "2023-12-01T00:00:00.000Z" },
      { "provider": "Discord", "expirationDate": "2024-06-01T00:00:00.000Z" },
      { "provider": "Github", "expirationDate": "2024-01-20T00:00:00.000Z" }
    ],
    "score": 12.5,
    "expirationDate": "2024-01-20T00:00:00.000Z"
  },
  "low-score": {
    "description": "Low Score - Below Threshold",
    "stamps": ["Google"],
    "score": 2.5,
    "expirationDate": "2024-04-15T00:00:00.000Z"
  },
  "onchain-focus": {
    "description": "On-chain Activity Focus",
    "stamps": [
      "ETHBalance", "FirstEthTxnProvider", "EthGasSpent",
      "EthTransactions", "NFT", "GnosisSafe", "ENS",
      "ZkSyncBalance", "PolygonBalance", "OptimismBalance"
    ],
    "score": 45.0,
    "expirationDate": "2024-04-15T00:00:00.000Z"
  }
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. Install and configure MSW
2. Create basic mock handlers for all endpoints
3. Implement dev mode authentication bypass
4. Add environment variable configuration

### Phase 2: Mock Data System (Week 2)
1. Build stamp generator functions
2. Create scenario management system
3. Implement nullifier generation
4. Add EIP712 mock signatures

### Phase 3: Developer Tools (Week 3)
1. Build simplified DevPanel component
2. Add scenario dropdown
3. Create Playwright helpers

### Phase 4: Documentation & Rollout (Week 4)
1. Document all mock scenarios
2. Create developer guide
3. Add example Playwright tests
4. Team training

## Usage Examples

### Basic Development
```bash
# Start with dev mode
NEXT_PUBLIC_DEV_MODE=true yarn dev

# App starts with mock data, no wallet needed!
```

### Playwright Testing
```typescript
test('user can add stamps', async ({ page }) => {
  // Load power user scenario
  await page.evaluate(() => window.mockScenario('power-user'))
  
  // Test UI without real authentication
  await page.goto('/dashboard')
  await expect(page.locator('.stamp-count')).toContainText('52')
})
```

### Quick UI Iteration
```bash
# Start with dev mode
NEXT_PUBLIC_DEV_MODE=true yarn dev

# Use the DevPanel dropdown to switch between scenarios:
# - New User (Empty)
# - Basic User (Few Stamps)
# - Power User (50+ Stamps)
# - Expired Stamps (Mixed States)
# - Low Score (Below Threshold)
# - On-chain Activity Focus

# Changes hot-reload instantly!
```

## Benefits

1. **Instant Development** - No wallet or authentication needed
2. **Consistent Testing** - Reproducible states for QA
3. **Rapid Prototyping** - Test edge cases easily
4. **E2E Automation** - Perfect for Playwright
5. **Zero Production Impact** - Only active in dev mode
6. **Team Scalability** - New developers productive immediately

## Technical Considerations

- All mocks use the exact data format from production (including nullifiers)
- EIP712 signatures are properly structured (just with mock values)
- 90-day expiration matches production behavior
- Supports all existing stamp providers
- Works with current React Context architecture

## What's Been Implemented

### Working Features
1. **Dev Mode Toggle** - Set `NEXT_PUBLIC_DEV_MODE=true` to enable
2. **Mock Authentication** - Automatic wallet connection with address `0x0000000000000000000000000000000000000001`
3. **Mock API Responses** - All major endpoints return realistic data
4. **DevPanel UI** - Bottom-right panel for switching scenarios
5. **Pre-built Scenarios** - 8 different user states to test
6. **Hot Module Replacement** - Works with Next.js dev server

### Key Files Created/Modified
- `/app/mocks/handlers.ts` - MSW request handlers
- `/app/mocks/generators.ts` - Mock data generators
- `/app/mocks/scenarios.json` - Pre-built test scenarios
- `/app/mocks/browser.ts` - MSW browser setup
- `/app/components/DevPanel.tsx` - Developer control panel
- `/app/components/DevModeProvider.tsx` - Dev mode context wrapper
- `/app/mocks/wagmi.tsx` - Mock wagmi hooks
- `/app/mocks/datastoreConnectionContext.tsx` - Mock datastore context
- `/app/next.config.js` - Webpack aliases for module mocking

### Known Issues
1. **Loading Overlay** - "One moment while we load your Stamps..." persists
2. **Scenario Switching** - Requires page refresh to take effect
3. **Score Updates** - Mock score doesn't update when changing scenarios
4. **Stamp Display** - Individual stamps not showing in UI yet

## Next Steps

1. ✅ ~~Get team buy-in on approach~~
2. ✅ ~~Set up MSW infrastructure~~
3. ✅ ~~Start with basic scenarios~~
4. 🚧 Fix remaining UI issues (loading overlay, stamp display)
5. 🚧 Implement dynamic scenario switching
6. 📅 Add Playwright test helpers
7. 📅 Create comprehensive developer documentation
8. 📅 Integrate with existing test suite

This approach will transform the Gitcoin Passport development experience while maintaining the stability required for 100k+ daily users.

## Claude Code Session Progress (2025-07-02 & 2025-07-03)

### Issues Identified and Fixed

#### 1. Loading Overlay Persistence Issue ✅
**Problem**: The "One moment while we load your Stamps..." overlay was blocking the UI indefinitely in dev mode.

**Root Causes**:
- `CERAMIC_CACHE_ENDPOINT` environment variable was undefined in dev mode
- PassportDatabase was being initialized with an empty URL
- No MSW handler existed for the actual endpoint URL pattern
- The ceramic context wasn't making the passport fetch request

**Fixes Applied**:
1. **Updated `ceramicContext.tsx`** (line 206-208):
   ```typescript
   const ceramicEndpoint = process.env.NEXT_PUBLIC_DEV_MODE === "true" 
     ? "http://localhost:8002/ceramic-cache"
     : CERAMIC_CACHE_ENDPOINT || "";
   ```

2. **Updated MSW handlers** to intercept the correct URL:
   - Changed from `/ceramic-cache/passport` to `/ceramic-cache/stamp`
   - Added proper response format matching `PassportLoadResponse` expectations

3. **Updated CLAUDE.md** with note about using Playwright MCP tools for dev server interaction

#### 2. Stamp Display Issue ✅ (2025-07-03)
**Problem**: Individual stamps not showing in UI even when data is being fetched.

**Root Causes**:
- Mock score endpoint wasn't returning `stamp_scores` field needed by ScorerContext
- DatastoreConnectionContext wasn't being properly mocked, causing authentication issues
- Stamp IDs in mock handlers were undefined due to optional `id` field in Stamp type
- DevPanel scenario selection wasn't persisting across page reloads

**Fixes Applied**:
1. **Updated mock score endpoint** to include stamp_scores:
   ```typescript
   // Added to score endpoint response
   stamp_scores: { "Google": "1.5", "Discord": "1.5", ... },
   stamps: { "Google": { score: "1.5", dedup: false }, ... }
   ```

2. **Fixed stamp ID issue** in handlers:
   - Changed from using `stamp.id` to `stamp.provider` as the ID
   - This matches how the PassportDatabase processes stamps

3. **Added scenario persistence** to DevPanel:
   - Now saves selected scenario to localStorage
   - Restores on page reload for better DX

4. **Fixed webpack alias** for DatastoreConnectionContext:
   - Corrected the path to match exact import in ceramicContext.tsx

5. **Updated weights endpoint** to include all providers used in scenarios

### Remaining Tasks

#### Medium Priority
1. **Implement dynamic scenario switching** 📅
   - Currently requires page refresh when changing scenarios
   - Need to implement hot-swapping of mock data without reload

2. **Fix mock score updates** 📅
   - Score doesn't update when changing scenarios
   - May be related to the scenario switching issue

#### Low Priority
3. **Add Playwright test helpers** 📅
   - Create utilities for common dev mode testing patterns
   - Document testing workflows

4. **Create comprehensive developer documentation** 📅
   - Expand dev mode usage guide
   - Add troubleshooting section
   - Document all available scenarios

5. **Integrate with existing test suite** 📅
   - Ensure dev mode works with existing tests
   - Add dev mode-specific tests

### Technical Debt to Address
- MSW handlers could be more comprehensive (missing some edge cases)
- Dev panel UI could be more feature-rich (add refresh button, show current data)
- Consider adding a "reset" functionality to clear all stamps
- Add better error handling for failed mock requests
- Consider adding more realistic scoring based on actual platform weights

### What's Working Now
1. **Dev Mode Authentication** - Automatic wallet connection with mock address
2. **Stamp Display** - Stamps properly show in the UI with correct scores
3. **Scenario Selection** - DevPanel allows switching between different user states
4. **Data Persistence** - Selected scenario persists across page reloads
5. **Mock API Responses** - All major endpoints return realistic data
6. **Loading States** - No more persistent loading overlays blocking the UI

### Usage Instructions
```bash
# Start the app in dev mode
cd app/
NEXT_PUBLIC_DEV_MODE=true yarn start

# Navigate to http://localhost:3000/#/dashboard
# You'll be automatically "logged in" with stamps based on the selected scenario
# Use the DevPanel in the bottom-right to switch between scenarios
```