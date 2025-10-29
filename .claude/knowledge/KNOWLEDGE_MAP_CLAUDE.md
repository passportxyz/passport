# 📚 Gitcoin Passport Knowledge Map

## 🏗️ Architecture
- @architecture/platform_system.md - How platforms are identified, structured, and split between frontend/backend
- @architecture/credential_verification_error_handling.md - Error flow through verification layers and lost error information
- @architecture/topnav_dynamic_content.md - Dynamic partner dashboards via customization API with SVG handling

## 📦 Workflows
- @workflows/package_management.md - Yarn commands and monorepo structure
- @workflows/storybook_component_development.md - Isolated component development with visual testing and Figma integration
- @workflows/topnav_implementation.md - Step-by-step approach for implementing dynamic partner dashboards

## 🎨 Patterns
- @patterns/humanid_platforms.md - CleanHands attestations, Biometrics migration, shared validation
- @patterns/figma_to_react_conversion.md - Converting Figma designs to production React components with theme integration

## 📝 Conventions
- @conventions/error_handling.md - Provider error philosophy and best practices

## 🧪 Testing
- @testing/provider_testing.md - How to test VerifiedPayload results correctly
- @testing/autoVerification_provider_ordering.md - Provider processing order and test expectations

## ⚠️ Gotchas & Non-Obvious Behaviors
- @gotchas/platform_identification.md - Platform name vs ID mismatches, dead code removal