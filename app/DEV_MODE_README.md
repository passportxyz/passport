# Gitcoin Passport Dev Mode

Dev Mode allows frontend developers to work on Gitcoin Passport UI without needing MetaMask, authentication, or backend services. Perfect for rapid CSS iterations and UI development.

## Quick Start

```bash
# Start the app in dev mode
NEXT_PUBLIC_DEV_MODE=true yarn dev

# The app will start with:
# ✅ No wallet connection needed
# ✅ Mock authentication
# ✅ Pre-configured test scenarios
# ✅ Instant hot-reload
```

## Features

### 1. **Mock Service Worker (MSW)**
- Intercepts all API calls and returns mock data
- No external dependencies needed
- Consistent, reproducible data

### 2. **Scenario Switcher**
- Simple dropdown in bottom-right corner
- Switch between pre-configured user states
- Instant reload with new data

### 3. **Available Scenarios**

| Scenario | Description | Stamps | Score |
|----------|-------------|--------|-------|
| `new-user` | Empty passport | 0 | 0 |
| `basic-user` | Few stamps | 3 | 15.5 |
| `power-user` | 50+ stamps | 50+ | 85.5 |
| `expired-stamps` | Mixed expiration states | 3 | 12.5 |
| `low-score` | Below threshold | 1 | 2.5 |
| `onchain-focus` | On-chain stamps only | 13 | 45.0 |
| `social-media-focus` | Social stamps only | 13 | 38.5 |
| `defi-user` | DeFi power user | 12 | 52.0 |

## How It Works

1. **DevModeProvider** - Wraps the app and mocks wagmi hooks
2. **MSW Handlers** - Intercept network requests and return scenario data
3. **Mock Generators** - Create proper VerifiableCredential structures
4. **DevPanel** - UI control for switching scenarios

## Adding New Scenarios

Edit `app/mocks/scenarios.json`:

```json
{
  "my-scenario": {
    "description": "My Custom Scenario",
    "stamps": ["Google", "Discord", "Github"],
    "score": 25.0,
    "evidence": {
      "success": true,
      "type": "CUSTOM"
    }
  }
}
```

## Architecture

```
app/
├── mocks/
│   ├── scenarios.json      # Scenario definitions
│   ├── handlers.ts         # MSW request handlers
│   ├── generators.ts       # Mock data generators
│   └── browser.ts          # MSW setup
├── components/
│   ├── DevModeProvider.tsx # Main dev mode wrapper
│   └── DevPanel.tsx        # Scenario switcher UI
```

## Tips

- Changes to scenarios.json require page reload
- MSW logs all intercepted requests in console
- Look for "🔧 Dev Mode:" prefixed logs
- The mock address is always `0xDEV123456789ABCDEF123456789ABCDEF123456`

## Troubleshooting

**Q: Dev panel not showing?**
A: Check that `NEXT_PUBLIC_DEV_MODE=true` is set

**Q: Getting real API calls?**
A: MSW may not be initialized. Check console for "MSW Started" message

**Q: Scenario not loading?**
A: Page reload is required after changing scenarios

## Production Safety

- Dev mode only activates when `NEXT_PUBLIC_DEV_MODE=true`
- MSW is a dev dependency and not bundled in production
- All mock code is tree-shaken in production builds