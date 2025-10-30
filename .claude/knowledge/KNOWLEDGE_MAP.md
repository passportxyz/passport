# 📚 Gitcoin Passport Knowledge Map

*Last updated: 2025-10-29*

## 🏗️ Architecture
- [Platform System Architecture](architecture/platform_system.md) - How platforms are identified, structured, and split between frontend/backend
- [Credential Verification Error Handling](architecture/credential_verification_error_handling.md) - Error flow through verification layers and lost error information
- [TopNav Dynamic Content Architecture](architecture/topnav_dynamic_content.md) - Dynamic partner dashboards with centralized data preparation in useCustomization hook

## 📦 Workflows
- [Package Management](workflows/package_management.md) - Yarn commands and monorepo structure
- [Storybook Component Development](workflows/storybook_component_development.md) - Isolated component development with visual testing and Figma integration
- [TopNav Implementation Workflow](workflows/topnav_implementation.md) - Step-by-step approach for implementing dynamic partner dashboards

## 🎨 Patterns
- [HumanID Platform Patterns](patterns/humanid_platforms.md) - CleanHands attestations, Biometrics migration, shared validation
- [Figma to React Conversion](patterns/figma_to_react_conversion.md) - Converting Figma designs to production React components with theme integration
- [Customization Data Preparation](patterns/customization_data_preparation.md) - Pre-filtering pattern in useCustomization hook for cleaner components

## 📝 Conventions
- [Error Handling Conventions](conventions/error_handling.md) - Provider error philosophy and best practices

## 🧪 Testing
- [Provider Testing Patterns](testing/provider_testing.md) - How to test VerifiedPayload results correctly
- [AutoVerification Provider Ordering](testing/autoVerification_provider_ordering.md) - Provider processing order and test expectations

## ⚠️ Gotchas & Non-Obvious Behaviors
- [Platform Identification](gotchas/platform_identification.md) - Platform name vs ID mismatches, dead code removal