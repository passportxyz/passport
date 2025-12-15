# SIWE Authentication Migration

## The Problem

After migrating from DID-based authentication to SIWE, we introduced a UX regression: **users are asked to sign with their wallet for every credential claim**.

### Old Flow (DID-based)
1. User signs SIWE once → DID session established
2. `did.createDagJWS()` signs subsequent requests **automatically in background**
3. User only sees one signature request

### Current Flow (Broken)
1. User signs SIWE once → Gets JWT for database access
2. Each credential claim calls `signMessageAsync()` → **wallet popup every time**
3. Terrible UX - defeats the purpose of session-based auth

## The Solution

The JWT issued by the scorer already contains the user's address (as `did:pkh:eip155:1:0xADDRESS`). The IAM should simply **verify and trust this JWT** instead of requiring per-request signatures.

### Target Flow
1. User signs SIWE once at login
2. Scorer verifies SIWE signature (handles EOA + smart wallets)
3. Scorer issues JWT with `did` claim containing user's address
4. Frontend stores JWT
5. Frontend sends JWT to IAM with credential requests
6. **IAM verifies JWT and extracts address from `did` claim**
7. IAM issues credentials - no additional signatures needed

## The JWT Signing Problem

Here's where we hit a snag. The scorer currently uses **symmetric JWT signing**:

```python
# passport-scorer/api/scorer/settings/base.py
NINJA_JWT = {
    "SIGNING_KEY": SECRET_KEY,  # HS256 (HMAC) - symmetric
}
```

With symmetric signing (HS256):
- Same secret signs AND verifies
- To verify, IAM needs the scorer's `SECRET_KEY`
- Requires sharing secrets between services

### The Right Solution: Asymmetric Signing

Switch to RS256 or ES256:
- **Private key** signs (scorer keeps this secret)
- **Public key** verifies (can be shared with anyone)
- IAM just needs the public key to verify JWTs
- Truly decentralized authentication - the whole point of JWTs

### Scorer Changes Required

1. Generate RSA or ECDSA key pair
2. Configure ninja_jwt to use RS256:
   ```python
   NINJA_JWT = {
       "ALGORITHM": "RS256",
       "SIGNING_KEY": PRIVATE_KEY,      # Keep secret
       "VERIFYING_KEY": PUBLIC_KEY,     # Can be shared
   }
   ```
3. Expose public key (either in config or via `.well-known/jwks.json` endpoint)

### IAM Changes Required

1. Add `jsonwebtoken` package
2. Configure with scorer's public key
3. Verify incoming JWTs and extract `did` claim
4. Use address from `did` for credential issuance

## The Smart Wallet Multi-Chain Problem

There's a second issue: **smart wallet verification only works on mainnet**.

### Current Scorer Code
```python
# passport-scorer/api/ceramic_cache/api/v1.py
def is_smart_wallet(address: str) -> bool:
    w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URL))  # Mainnet only!
    code = w3.eth.get_code(address)
    return len(code) > 0
```

### The Problem
- Coinbase Smart Wallet users on Base → not detected as smart wallet
- Argent users on Arbitrum → not detected
- Any smart wallet not deployed on mainnet → fails

### The Fix
Check multiple chains for smart wallet detection:

```python
CHAIN_RPC_URLS = {
    1: "https://eth-mainnet.g.alchemy.com/v2/...",      # Mainnet
    8453: "https://base-mainnet.g.alchemy.com/v2/...",  # Base
    42161: "https://arb-mainnet.g.alchemy.com/v2/...",  # Arbitrum
    10: "https://opt-mainnet.g.alchemy.com/v2/...",     # Optimism
}

def is_smart_wallet(address: str) -> bool:
    for chain_id, rpc_url in CHAIN_RPC_URLS.items():
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        code = w3.eth.get_code(address)
        if len(code) > 0:
            return True
    return False
```

Similarly, EIP-1271 signature verification needs to happen on the chain where the wallet is deployed.

## Summary of Required Changes

### Scorer (passport-scorer)

| Change | Priority | Description |
|--------|----------|-------------|
| Asymmetric JWT signing | **HIGH** | Switch from HS256 to RS256, expose public key |
| Multi-chain smart wallet detection | **HIGH** | Check Base, Arbitrum, Optimism, not just mainnet |
| Multi-chain EIP-1271 verification | **HIGH** | Verify signatures on the correct chain |

### IAM (passport/identity)

| Change | Priority | Description |
|--------|----------|-------------|
| JWT verification | **HIGH** | Verify scorer JWTs using public key |
| Extract address from `did` claim | **HIGH** | Parse `did:pkh:eip155:1:0xADDRESS` format |
| Remove per-request signature requirement | **HIGH** | Trust JWT instead of requiring wallet signature |

### Frontend (passport/app)

| Change | Priority | Description |
|--------|----------|-------------|
| Pass JWT to IAM | **MEDIUM** | Send JWT with credential requests |
| Remove `signMessageAsync` for credentials | **MEDIUM** | No longer needed once IAM trusts JWT |
| Store SIWE auth for backwards compat | **LOW** | Only if we need fallback during migration |

## Migration Strategy

1. **Phase 1: Scorer** - Implement asymmetric JWT signing + multi-chain smart wallet support
2. **Phase 2: IAM** - Add JWT verification, accept JWT as auth for credential requests
3. **Phase 3: Frontend** - Pass JWT to IAM, remove per-request signing
4. **Phase 4: Cleanup** - Remove old DID verification code

Phases 2-4 can be deployed together once Phase 1 is complete.

## Questions to Resolve

1. **Key management**: Where to store the RSA/ECDSA private key? AWS Secrets Manager?
2. **Key rotation**: Strategy for rotating JWT signing keys?
3. **Public key distribution**: Endpoint (`.well-known/jwks.json`) or static config?
4. **Chain priority**: Which chains to check for smart wallets, in what order?
5. **Caching**: Cache `isSmartWallet` results to avoid repeated RPC calls?

## References

- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [EIP-1271 - Standard Signature Validation](https://eips.ethereum.org/EIPS/eip-1271)
- [SIWE - Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [ninja-jwt RS256 configuration](https://django-ninja-jwt.readthedocs.io/en/latest/settings.html)
