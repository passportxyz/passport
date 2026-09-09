# Passport Wiki

Agent-maintained knowledge base. Read pages relevant to what you're touching; update them when code and wiki disagree (code is truth). Conventions: `.agents/skills/repo-wiki/SKILL.md`.

## Architecture

- [Platform System](architecture/platform-system.md) — platform IDs vs display names, frontend/backend split inside platforms/, isEVM single source of truth
- [Custom Platforms](architecture/custom-platforms.md) — CUSTOM_PLATFORM_TYPE_INFO registry, runtime partner stamps, CustomNFT provider, symmetric-guard gotcha in usePlatforms
- [HumanID Platforms](architecture/humanid-platforms.md) — composable credential sources (SBT/attestation/off-chain), Government ID multi-source order, free ZK Passport 7-day expiry clamp, CleanHands differences
- [TopNav & Partner Customization](architecture/topnav-customization.md) — dynamic partner dashboards from the scorer customization API, data-prep-in-hook pattern, SVG logo handling

## Development

- [Writing & Testing Providers](development/providers.md) — no top-level try-catch, external call checklist (timeouts, encoding, no silent fallbacks), VerifiedPayload test patterns, autoVerification ordering
- [Storybook & Design-to-Code](development/storybook.md) — storybook setup, component/stories/mocks layout, Figma-to-React conversion rules
