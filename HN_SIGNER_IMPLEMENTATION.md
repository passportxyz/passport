# HN Signer Service Implementation

## Overview

This document summarizes the implementation of the HN (Human Network) Signer service for GitHub issue #3537. The HN Signer service isolates cryptographic OPRF operations to a dedicated internal service, improving security and separation of concerns.

## Architecture

### Service Flow
```
IAM/Embed Services → Private ALB → HN Signer Container → Human Network Relay
```

### Key Components
- **HN Signer Service**: Internal ECS Fargate service running `mishtinetwork/signer:latest`
- **Private ALB**: Internal load balancer with path-based routing (`/hn-signer/*`)
- **Security**: VPC-internal only, no external access

## Implementation Summary

### Infrastructure Changes
- **Created**: `infra/aws/hn_signer.ts` - Complete ECS service infrastructure
- **Updated**: `infra/aws/stacks.ts` - Added private ALB references
- **Updated**: `infra/aws/index.ts` - Exported HN Signer components
- **Updated**: `infra/aws/iam.ts` & `embed.ts` - Added `HN_SIGNER_URL` environment variable

### Code Changes
- **Updated**: `identity/src/humanNetworkOprf.ts` - Now calls HN Signer service instead of direct WASM
- **Simplified API**: Only passes `value` to signer, not `clientPrivateKey`
- **Security**: Private key remains securely in signer service

### Documentation
- **Updated**: `CLAUDE.md` - Added comprehensive infrastructure architecture documentation

## Environment Variables

### HN Signer Service Requires:
```bash
# From AWS Secrets Manager (PASSPORT_VC_SECRETS_ARN)
HUMAN_NETWORK_CLIENT_PRIVATE_KEY=<cryptographic_key>

# From 1Password (passport-xyz-{env}-env/hn-signer section)
HUMAN_NETWORK_RELAY_URL=<relay_endpoint>

# Service configuration
NODE_ENV=production|development
PORT=3000
DISABLE_RATE_LIMITING=true
```

### IAM/Embed Services Require:
```bash
# Internal service URL (automatically configured via infrastructure)
HN_SIGNER_URL=http://<private-alb>/hn-signer
```

### Services No Longer Need:
- ❌ `HUMAN_NETWORK_CLIENT_PRIVATE_KEY` (moved to signer service)

## Security Improvements

1. **Private Key Isolation**: Cryptographic key never leaves the HN Signer service
2. **Principle of Least Privilege**: IAM/embed services only have access to necessary endpoints
3. **Internal-Only Access**: HN Signer accessible only via private ALB within VPC
4. **Centralized Secret Management**: High-security secrets managed in dedicated service

## Infrastructure Features

- **Auto-scaling**: 1-8 instances based on CPU utilization
- **Health Checks**: `/health` endpoint monitoring
- **CloudWatch Monitoring**: Error metrics and alerting
- **Rate Limiting**: Disabled for internal service-to-service communication
- **Resource Sizing**: Environment-appropriate CPU/memory allocation

## API Changes

### Before (Direct WASM):
```typescript
humanNetworkOprf({
  value: "data",
  clientPrivateKey: "secret_key", 
  relayUrl: "http://relay"
})
```

### After (Signer Service):
```typescript
// Internal API call to HN Signer
POST /hn-signer/sign
{
  "value": "data"
}
// Private key and relay URL handled internally by signer
```

## Next Steps

1. **Deploy Infrastructure**:
   ```bash
   cd infra/aws
   pulumi up
   ```

2. **Configure 1Password Secrets**:
   - Add `HUMAN_NETWORK_RELAY_URL` to `passport-xyz-{env}-env/hn-signer` section

3. **Test Integration**:
   - Verify HN Signer service health
   - Test OPRF operations through IAM service
   - Monitor CloudWatch logs and metrics

4. **Clean Up (After Testing)**:
   - Remove `HUMAN_NETWORK_CLIENT_PRIVATE_KEY` from IAM/embed services
   - Remove unused WASM dependencies from identity package

5. **Monitoring**:
   - Set up alerts for HN Signer service errors
   - Monitor internal ALB metrics
   - Verify end-to-end OPRF operation latency

## Files Modified

```
infra/aws/
├── hn_signer.ts          # ✅ New: Complete HN Signer infrastructure
├── stacks.ts             # ✅ Updated: Private ALB references
├── index.ts              # ✅ Updated: Export HN Signer components
├── iam.ts                # ✅ Updated: Add HN_SIGNER_URL
└── embed.ts              # ✅ Updated: Add HN_SIGNER_URL

identity/src/
└── humanNetworkOprf.ts   # ✅ Updated: Call signer service

CLAUDE.md                 # ✅ Updated: Infrastructure documentation
```

## Verification Checklist

- [ ] HN Signer service deploys successfully
- [ ] Private ALB routing works (`/hn-signer/*`)
- [ ] IAM service can reach HN Signer internally
- [ ] Embed service can reach HN Signer internally
- [ ] OPRF operations complete successfully
- [ ] No external access to HN Signer service
- [ ] CloudWatch monitoring active
- [ ] Auto-scaling configured properly