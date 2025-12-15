// ---- Web3 packages
import { isAddress, getAddress } from "ethers";
import * as DIDKit from "@spruceid/didkit-wasm-node";

// All provider exports from platforms
import { handleAxiosError } from "@gitcoin/passport-platforms";
import {
  autoVerifyStamps,
  PassportScore,
  verifyCredential,
  hasValidIssuer,
  verifyChallengeAndGetAddress,
  groupProviderTypesByPlatform,
  verifyProvidersAndIssueCredentials,
  getChallengeRecord,
  issueChallengeCredential,
  getIssuerInfo,
  serverUtils,
} from "./utils/identityHelper.js";
import { verifyAndExtractAddress, extractBearerToken } from "./utils/scorerJwt.js";
import {
  VerifiableCredential,
  VerifyRequestBody,
  ChallengeRequestBody,
  CredentialResponseBody,
} from "@gitcoin/passport-types";
import {
  AutoVerificationFields,
  AutoVerificationRequestBodyType,
  AutoVerificationResponseBodyType,
} from "./handlers.types.js";

const { InternalApiError, createHandler } = serverUtils;

import axios from "axios";
import { ApiError } from "../../identity/dist/esm/serverUtils/apiError.js";

const apiKey = process.env.SCORER_API_KEY as string;

export const addStampsAndGetScore = async ({
  address,
  scorerId,
  stamps,
}: AutoVerificationFields & {
  stamps: VerifiableCredential[];
}): Promise<PassportScore> => {
  try {
    const scorerResponse: {
      data?: {
        score?: PassportScore;
      };
    } = await axios.post(
      `${process.env.SCORER_ENDPOINT}/internal/embed/stamps/${address}`,
      {
        stamps,
        scorer_id: scorerId,
      },
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!scorerResponse.data?.score) {
      throw new InternalApiError("No score returned from Scorer Embed API");
    }

    return scorerResponse.data.score;
  } catch (error) {
    handleAxiosError(error, "Scorer Embed API", InternalApiError, [apiKey]);
  }
};

export const getScore = async ({
  address,
  scorerId,
}: {
  address: string;
  scorerId: string;
}): Promise<PassportScore> => {
  try {
    const scorerResponse: {
      data?: {
        score?: PassportScore;
      };
    } = await axios.get(`${process.env.SCORER_ENDPOINT}/internal/embed/score/${scorerId}/${address}`, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!scorerResponse.data?.score) {
      throw new InternalApiError("No score returned from Scorer Embed API");
    }

    return scorerResponse.data.score;
  } catch (error) {
    handleAxiosError(error, "Scorer Embed API", InternalApiError, [apiKey]);
  }
};

export const autoVerificationHandler = createHandler<AutoVerificationRequestBodyType, AutoVerificationResponseBodyType>(
  async (req, res) => {
    const requestStartTime = Date.now();
    const { address, scorerId, credentialIds } = req.body;

    if (!isAddress(address)) {
      throw new ApiError("Invalid address", "400_BAD_REQUEST");
    }

    const { credentials, credentialErrors, timings } = await autoVerifyStamps({
      address,
      scorerId,
      credentialIds,
    });

    const score = await addStampsAndGetScore({ address, scorerId, stamps: credentials });

    // Include credentialErrors in the response
    const response = {
      ...score,
      credentialErrors,
      debug: undefined as
        | {
            timings: {
              platforms: Record<string, { total_ms: number; providers: Record<string, number> }>;
              total_verification_ms: number;
              total_request_ms: number;
            };
          }
        | undefined,
    };

    // Check for debug timing header
    if (req.headers["x-debug-timing"] && timings) {
      // Format timings into the structure requested
      response.debug = {
        timings: {
          platforms: timings.platforms,
          total_verification_ms: Math.max(...Object.values(timings.platforms).map((p) => p.total_ms)),
          total_request_ms: Date.now() - requestStartTime,
        },
      };
    }

    // TODO should we issue a score VC?
    return void res.json(response);
  }
);

type EmbedVerifyRequestBody = VerifyRequestBody & {
  scorerId: string;
};

type CredentialError = {
  provider: string;
  error: string;
  code?: number;
};

type EmbedVerifyResponseBody = {
  score: PassportScore;
  credentials: VerifiableCredential[];
  credentialErrors?: CredentialError[];
};

export const verificationHandler = createHandler<EmbedVerifyRequestBody, EmbedVerifyResponseBody>(async (req, res) => {
  const { challenge, payload, scorerId } = req.body;

  // Check for JWT authentication first (new SIWE-based flow)
  const authHeader = req.headers.authorization as string | undefined;
  const token = extractBearerToken(authHeader);

  let address: string | undefined;

  if (token) {
    // JWT authentication - verify token and extract address
    const jwtAddress = verifyAndExtractAddress(token);

    if (jwtAddress) {
      // JWT is valid - use the address from the JWT, skip challenge verification
      console.log(`JWT authenticated embed request for address: ${jwtAddress}`);
      address = jwtAddress;
    } else {
      // JWT verification failed, fall through to challenge-based auth
      console.warn("JWT verification failed, falling back to challenge-based auth");
    }
  }

  // If we don't have an address yet (no JWT or JWT failed), try challenge-based auth
  if (!address) {
    // Legacy challenge-based authentication flow
    if (!challenge) {
      throw new ApiError("Missing challenge - provide either JWT token or challenge credential", "401_UNAUTHORIZED");
    }

    // Check the challenge and the payload is valid before issuing a credential from a registered provider
    const verified = await verifyCredential(DIDKit, challenge);
    if (!verified || !hasValidIssuer(challenge.issuer)) {
      throw new ApiError("Unable to verify payload", "401_UNAUTHORIZED");
    }

    address = await verifyChallengeAndGetAddress(req.body);

    // Check signer and type
    const isSigner = challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
    const isType = challenge.credentialSubject.provider === `challenge-${payload.type}`;

    if (!isSigner || !isType) {
      throw new ApiError(
        "Invalid challenge '" + [!isSigner && "signer", !isType && "provider"].filter(Boolean).join("' and '") + "'",
        "401_UNAUTHORIZED"
      );
    }
  }

  // At this point, address must be set (either via JWT or challenge auth)
  if (!address) {
    throw new ApiError("Authentication failed", "401_UNAUTHORIZED");
  }

  const types = payload.types?.filter((type) => type) || [];
  const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

  const { credentials: credentialsVerificationResponses } = await verifyProvidersAndIssueCredentials(
    providersGroupedByPlatforms,
    address,
    payload
  );

  const stamps: VerifiableCredential[] = [];
  const credentialErrors: CredentialError[] = [];

  // Separate successful credentials from errors
  credentialsVerificationResponses.forEach((response, index) => {
    if ("credential" in response && response.credential) {
      stamps.push(response.credential);
    } else if ("error" in response) {
      // Get the provider name from the original types array
      const providerName = types[index] || "unknown";
      credentialErrors.push({
        provider: providerName,
        error: response.error || "Verification failed",
        code: response.code,
      });
    }
  });

  const score = await addStampsAndGetScore({
    address,
    scorerId,
    stamps,
  });

  return void res.json({
    score: score,
    credentials: stamps,
    credentialErrors,
  });
});

// TODO This is copied from the iam/, should we source it from identity/ or something?
export const getChallengeHandler = createHandler<ChallengeRequestBody, CredentialResponseBody>(async (req, res) => {
  const payload = req.body.payload;

  (["address", "type"] as const).forEach((key) => {
    if (!payload[key]) {
      throw new ApiError(`Missing ${key} from challenge request body`, "400_BAD_REQUEST");
    }
  });

  // ensure address is check-summed
  payload.address = getAddress(payload.address);

  // generate a challenge for the given payload
  const record = {
    version: "0.0.0",
    ...getChallengeRecord(payload),
  };

  const { issuer } = getIssuerInfo();

  // generate a VC for the given payload
  const credential = await issueChallengeCredential(DIDKit, issuer.key, record);

  // return the verifiable credential
  return void res.json(credential);
});

type GetScoreRequestBody = {
  scorerId: string;
  address: string;
};

export const getScoreHandler = createHandler<GetScoreRequestBody, PassportScore>(async (req, res) => {
  const { scorerId, address } = req.params;
  const score = await getScore({ address, scorerId });
  return void res.json(score);
});
