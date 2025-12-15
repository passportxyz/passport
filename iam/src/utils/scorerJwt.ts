/**
 * JWT verification for SIWE-issued tokens
 *
 * Verifies JWTs issued by the passport-scorer using RS256 asymmetric signing.
 * Extracts the user's address from the `did` claim (format: did:pkh:eip155:1:0xADDRESS)
 */
import jwt from "jsonwebtoken";

// Public key for verifying SIWE JWTs (RS256)
const SIWE_JWT_PUBLIC_KEY = process.env.SIWE_JWT_PUBLIC_KEY;

export interface ScorerJwtPayload {
  did: string;
  exp: number;
  iat: number;
  jti: string;
  token_type: string;
}

/**
 * Verify a scorer JWT and extract the user's address
 *
 * @param token - The JWT token from Authorization header
 * @returns The lowercase address extracted from the did claim, or null if invalid
 */
export function verifyAndExtractAddress(token: string): string | null {
  if (!SIWE_JWT_PUBLIC_KEY) {
    console.error("SIWE_JWT_PUBLIC_KEY not configured");
    return null;
  }

  try {
    const decoded = jwt.verify(token, SIWE_JWT_PUBLIC_KEY, {
      algorithms: ["RS256"],
      issuer: "passport-scorer",
    }) as ScorerJwtPayload;

    // Extract address from DID format: did:pkh:eip155:1:0xADDRESS
    const did = decoded.did;
    if (!did || !did.startsWith("did:pkh:eip155:1:")) {
      console.error("Invalid DID format in JWT:", did);
      return null;
    }

    const address = did.split(":").pop();
    return address?.toLowerCase() || null;
  } catch (error) {
    console.error("JWT verification failed:", error);
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
