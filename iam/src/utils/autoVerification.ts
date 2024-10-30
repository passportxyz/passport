// import { EnsProvider } from './providers/ens';
// Should this file be an app factory? If it was, we could move the provider config to main.ts and test in isolation

// ---- Server
import { Request } from "express";

// ---- Web3 packages
import { utils } from "ethers";

// ---- Types
import { Response } from "express";
import { PROVIDER_ID, ValidResponseBody, SignatureType, VerifiableCredential } from "@gitcoin/passport-types";
import { ParamsDictionary } from "express-serve-static-core";

// All provider exports from platforms
import { platforms } from "@gitcoin/passport-platforms";

import { errorRes, addErrorDetailsToMessage, ApiError } from "./helpers.js";
import axios from "axios";
import { checkConditionsAndIssueCredentials } from "./credentials.js";

type AutoVerificationFields = {
  address: string;
  scorerId: string;
};

type AutoVerificationResponseData = {
  score: string;
  threshold: string;
};

const apiKey = process.env.SCORER_API_KEY;

export const autoVerificationHandler = async (
  req: Request<ParamsDictionary, AutoVerificationResponseData, AutoVerificationFields>,
  res: Response
): Promise<void> => {
  try {
    const { address, scorerId } = req.body;

    if (!utils.isAddress(address)) {
      return void errorRes(res, "Invalid address", 400);
    }

    const stamps = await getPassingEvmStamps({ address, scorerId });

    const { score, threshold } = await addStampsAndGetScore({ address, scorerId, stamps });

    // TODO should we issue a score VC?

    return void res.json({ score, threshold });
  } catch (error) {
    if (error instanceof ApiError) {
      return void errorRes(res, error.message, error.code);
    }
    const message = addErrorDetailsToMessage("Unexpected error when processing request", error);
    return void errorRes(res, message, 500);
  }
};

const getEvmProviders = ({ scorerId }: { scorerId: string }): PROVIDER_ID[] => {
  const evmPlatforms = Object.values(platforms).filter(({ PlatformDetails }) => PlatformDetails.isEVM);

  // TODO we should use the scorerId to check for any EVM stamps particular to a community, and include those here
  scorerId;

  return evmPlatforms
    .map(({ ProviderConfig }) => ProviderConfig.map(({ providers }) => providers.map(({ name }) => name)))
    .flat(2);
};

const getPassingEvmStamps = async ({ address, scorerId }: AutoVerificationFields): Promise<VerifiableCredential[]> => {
  const evmProviders = getEvmProviders({ scorerId });

  const credentialsInfo = {
    address,
    type: "EVMBulkVerify",
    types: evmProviders,
    version: "0.0.0",
    signatureType: "EIP712" as SignatureType,
  };

  const result = await checkConditionsAndIssueCredentials(credentialsInfo, address);

  return (result ? [result] : [])
    .flat()
    .filter(
      (credentialResponse): credentialResponse is ValidResponseBody =>
        (credentialResponse as ValidResponseBody).credential !== undefined
    )
    .map(({ credential }) => credential);
};

const addStampsAndGetScore = async ({
  address,
  scorerId,
  stamps,
}: AutoVerificationFields & { stamps: VerifiableCredential[] }): Promise<{
  score: string;
  threshold: string;
}> => {
  const scorerResponse: {
    data?: {
      score?: {
        score?: string;
        evidence?: {
          rawScore?: string | number;
          threshold?: string | number;
        };
      };
    };
  } = await axios.post(
    `${process.env.SCORER_ENDPOINT}/internal/stamps/${address}`,
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

  const scoreData = scorerResponse.data?.score || {};

  const score = String(scoreData.evidence?.rawScore || scoreData.score);
  const threshold = String(scoreData.evidence?.threshold || 20);

  return { score, threshold };
};
