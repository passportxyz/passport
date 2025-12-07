import {
  CredentialResponseBody,
  ErrorResponseBody,
  ValidResponseBody,
  VerifyRequestBody,
} from "@gitcoin/passport-types";

import {
  hasValidIssuer,
  serverUtils,
  verifyCredential,
  groupProviderTypesByPlatform,
  verifyProvidersAndIssueCredentials,
  verifyChallengeAndGetAddress,
} from "../utils/identityHelper.js";
import { verifyAndExtractAddress, extractBearerToken } from "../utils/scorerJwt.js";

const { ApiError, createHandler } = serverUtils;

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";

// All provider exports from platforms
export const verifyHandler = createHandler<VerifyRequestBody, CredentialResponseBody[]>(async (req, res) => {
  const { challenge, payload } = req.body;

  // Check for JWT authentication first (new SIWE-based flow)
  const authHeader = req.headers.authorization as string | undefined;
  const token = extractBearerToken(authHeader);

  if (token) {
    // JWT authentication - verify token and extract address
    const jwtAddress = verifyAndExtractAddress(token);

    if (jwtAddress) {
      // JWT is valid - use the address from the JWT, skip challenge verification
      console.log(`JWT authenticated request for address: ${jwtAddress}`);
      payload.address = jwtAddress;

      const types = payload.types.filter((type) => type);
      const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

      const { credentials } = await verifyProvidersAndIssueCredentials(
        providersGroupedByPlatforms,
        jwtAddress,
        payload
      );

      return void res.json(credentials);
    }
    // If JWT verification failed, fall through to challenge-based auth
    console.warn("JWT verification failed, falling back to challenge-based auth");
  }

  // Legacy challenge-based authentication flow
  // Each verify request should be received with a challenge credential detailing a signature
  if (!challenge) {
    throw new ApiError("Missing challenge - provide either JWT token or challenge credential", "401_UNAUTHORIZED");
  }

  // Check the challenge and the payload is valid before issuing a credential from a registered provider
  const verified = await verifyCredential(DIDKit, challenge);

  if (!hasValidIssuer(challenge.issuer)) {
    throw new ApiError("Invalid issuer", "401_UNAUTHORIZED");
  }

  if (!verified) {
    throw new ApiError("Invalid challenge", "401_UNAUTHORIZED");
  }

  const address = await verifyChallengeAndGetAddress(req.body);

  payload.address = address;

  // Check signer and type
  const isSigner = challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
  const isType = challenge.credentialSubject.provider === `challenge-${payload.type}`;

  if (!isSigner || !isType) {
    throw new ApiError(
      "Invalid challenge '" + [!isSigner && "signer", !isType && "provider"].filter(Boolean).join("' and '") + "'",
      "401_UNAUTHORIZED"
    );
  }

  const types = payload.types.filter((type) => type);
  const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

  const result = await verifyProvidersAndIssueCredentials(providersGroupedByPlatforms, address, payload);

  // Handle both cases: { credentials: [...] } or direct array
  let credentials: CredentialResponseBody[];
  if (Array.isArray(result)) {
    credentials = result;
  } else if (result && typeof result === "object" && "credentials" in result) {
    credentials = (result as { credentials: CredentialResponseBody[] }).credentials;
  } else {
    throw new ApiError("Unexpected response format from verification", "500_SERVER_ERROR");
  }

  if (!credentials || !Array.isArray(credentials)) {
    throw new ApiError("No credentials returned from verification", "500_SERVER_ERROR");
  }

  return void res.json(credentials);
});
