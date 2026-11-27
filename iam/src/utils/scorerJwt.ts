/**
 * JWT verification for SIWE-issued tokens
 *
 * Verifies JWTs issued by the passport-scorer using RS256 asymmetric signing.
 * Reads the signed EIP-155 subject and deployed-wallet scope.
 */
import jwt from "jsonwebtoken";

// Public key for verifying SIWE JWTs (RS256)
// Supports both raw PEM and base64-encoded PEM (for Docker/secrets managers)
function decodeKey(envVar: string): string | undefined {
  const value = process.env[envVar];
  if (!value) return undefined;
  // If it already looks like a PEM key, use it directly
  if (value.includes("-----BEGIN")) {
    return value;
  }
  // Otherwise, decode from base64
  try {
    return Buffer.from(value, "base64").toString("utf-8");
  } catch {
    console.error(`Failed to base64 decode ${envVar}`);
    return undefined;
  }
}

const SIWE_JWT_PUBLIC_KEY = decodeKey("SIWE_JWT_PUBLIC_KEY");

export interface ScorerJwtPayload {
  did: string;
  exp: number;
  iat: number;
  jti: string;
  token_type: string;
  chain_wallet?: boolean;
}

type ScorerWallet = { address: string; chainId?: number };

export function verifyAndExtractWallet(token: string): ScorerWallet | null {
  if (!SIWE_JWT_PUBLIC_KEY) {
    console.error("SIWE_JWT_PUBLIC_KEY not configured");
    return null;
  }

  try {
    const decoded = jwt.verify(token, SIWE_JWT_PUBLIC_KEY, {
      algorithms: ["RS256"],
      issuer: "passport-scorer",
    }) as ScorerJwtPayload;
    const match =
      typeof decoded.did === "string" ? /^did:pkh:eip155:([1-9][0-9]*):(0x[0-9a-f]{40})$/i.exec(decoded.did) : null;
    if (!match || !Number.isFinite(decoded.exp)) return null;

    const chainId = Number(match[1]);
    const address = match[2].toLowerCase();
    if (decoded.chain_wallet === true) {
      return decoded.token_type === "access" && Number.isSafeInteger(chainId) ? { address, chainId } : null;
    }
    return chainId === 1 ? { address } : null;
  } catch {
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 *
 * @param authHeader - The Authorization header value
 * @returns The token string, or null if not a valid Bearer token
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
