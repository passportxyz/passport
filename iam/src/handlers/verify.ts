import {
  CredentialResponseBody,
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

const { ApiError, createHandler } = serverUtils;

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";

// All provider exports from platforms
export const verifyHandler = createHandler<
  VerifyRequestBody,
  CredentialResponseBody[]
>(async (req, res) => {
  // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
  const { challenge, payload } = req.body;

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
  const isSigner =
    challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
  const isType =
    challenge.credentialSubject.provider === `challenge-${payload.type}`;

  if (!isSigner || !isType) {
    throw new ApiError(
      "Invalid challenge '" +
        [!isSigner && "signer", !isType && "provider"]
          .filter(Boolean)
          .join("' and '") +
        "'",
      "401_UNAUTHORIZED",
    );
  }

  const types = payload.types.filter((type) => type);
  const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

  const credentials = await verifyProvidersAndIssueCredentials(
    providersGroupedByPlatforms,
    address,
    payload,
  );

  return void res.json(credentials);
});
