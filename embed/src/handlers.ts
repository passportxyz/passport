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

export const autoVerificationHandler = createHandler<AutoVerificationRequestBodyType, AutoVerificationResponseBodyType>(
  async (req, res) => {
    const { address, scorerId, credentialIds } = req.body;

    if (!isAddress(address)) {
      throw new ApiError("Invalid address", "400_BAD_REQUEST");
    }

    const stamps = await autoVerifyStamps({
      address,
      scorerId,
      credentialIds,
    });

    const score = await addStampsAndGetScore({ address, scorerId, stamps });

    // TODO should we issue a score VC?
    return void res.json(score);
  }
);

type EmbedVerifyRequestBody = VerifyRequestBody & {
  scorerId: string;
};

type EmbedVerifyResponseBody = {
  score: PassportScore;
  credentials: VerifiableCredential[];
};

export const verificationHandler = createHandler<EmbedVerifyRequestBody, EmbedVerifyResponseBody>(async (req, res) => {
  // each verify request should be received with a challenge credential detailing a signature contained in the RequestPayload.proofs
  const { challenge, payload, scorerId } = req.body;

  // Check the challenge and the payload is valid before issuing a credential from a registered provider
  const verified = await verifyCredential(DIDKit, challenge);
  if (verified && hasValidIssuer(challenge.issuer)) {
    const address = await verifyChallengeAndGetAddress(req.body);

    // Check signer and type
    const isSigner = challenge.credentialSubject.id === `did:pkh:eip155:1:${address}`;
    const isType = challenge.credentialSubject.provider === `challenge-${payload.type}`;

    if (!isSigner || !isType) {
      throw new ApiError(
        "Invalid challenge '" + [!isSigner && "signer", !isType && "provider"].filter(Boolean).join("' and '") + "'",
        "401_UNAUTHORIZED"
      );
    }

    const types = payload.types?.filter((type) => type) || [];
    const providersGroupedByPlatforms = groupProviderTypesByPlatform(types);

    const credentialsVerificationResponses = await verifyProvidersAndIssueCredentials(
      providersGroupedByPlatforms,
      address,
      payload
    );

    const stamps = credentialsVerificationResponses.reduce((acc, response) => {
      if ("credential" in response && response.credential) {
        if (response.credential) {
          acc.push(response.credential);
        }
      }
      return acc;
    }, [] as VerifiableCredential[]);

    const score = await addStampsAndGetScore({
      address,
      scorerId,
      stamps,
    });

    return void res.json({
      score: score,
      credentials: stamps,
    });
  }

  throw new ApiError("Unable to verify payload", "401_UNAUTHORIZED");
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
