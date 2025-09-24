# 📚 Gitcoin Passport Knowledge Map

*Last updated: 2025-09-23*

## 🏗️ Architecture
- [Platform System Architecture](architecture/platform_system.md) - How platforms are identified, structured, and split between frontend/backend
- [Credential Verification Error Handling](architecture/credential_verification_error_handling.md) - Error flow through verification layers and lost error information

## 📦 Workflows
- [Package Management](workflows/package_management.md) - Yarn commands and monorepo structure

## 🎨 Patterns
- [HumanID Platform Patterns](patterns/humanid_platforms.md) - CleanHands attestations, Biometrics migration, shared validation

## 📝 Conventions
- [Error Handling Conventions](conventions/error_handling.md) - Provider error philosophy and best practices

## 🧪 Testing
- [Provider Testing Patterns](testing/provider_testing.md) - How to test VerifiedPayload results correctly
- [AutoVerification Provider Ordering](testing/autoVerification_provider_ordering.md) - Provider processing order and test expectations

## ⚠️ Gotchas & Non-Obvious Behaviors
- [Platform Identification](gotchas/platform_identification.md) - Platform name vs ID mismatches, dead code removal