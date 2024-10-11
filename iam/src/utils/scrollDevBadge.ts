// ---- Server
import { Request } from "express";

// ---- Web3 packages
import { BigNumber, utils } from "ethers";

// ---- Types
import { Response } from "express";
import { EasPayload, PassportAttestation, EasRequestBody } from "@gitcoin/passport-types";
import onchainInfo from "../../../deployments/onchainInfo.json" assert { type: "json" };

import { getEASFeeAmount } from "./easFees.js";
import { hasValidIssuer } from "../issuers.js";

// ---- Generate & Verify methods
import * as DIDKit from "@spruceid/didkit-wasm-node";
import { verifyCredential } from "@gitcoin/passport-identity";

// All provider exports from platforms

import {
  MultiAttestationRequest,
  NO_EXPIRATION,
  SchemaEncoder,
  ZERO_BYTES32,
} from "@ethereum-attestation-service/eas-sdk";
import { errorRes } from "./helpers.js";
import { ATTESTER_TYPES, getAttestationDomainSeparator, getAttestationSignerForChain } from "./attestations.js";
import { ethers } from "ethers";

const BADGE_CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "badgeLevel",
    outputs: [
      {
        internalType: "uint256",
        name: "badgeLevel",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const DEFAULT_REQUEST_DATA = {
  expirationTime: NO_EXPIRATION,
  revocable: true,
  refUID: ZERO_BYTES32,
  value: 0,
};

const BADGE_SCHEMA_ENCODER = new SchemaEncoder("address badge,bytes payload");
const BADGE_PAYLOAD_SCHEMA_ENCODER = new SchemaEncoder("uint256 level,bytes32[] hashes");

export function getScrollRpcUrl({ chainIdHex }: { chainIdHex: string }): string {
  return `https://scroll-${chainIdHex === "0x82750" ? "mainnet" : "sepolia"}.g.alchemy.com/v2/${
    process.env.ALCHEMY_API_KEY
  }`;
}

interface BadgeContract extends ethers.Contract {
  badgeLevel(address: string): Promise<ethers.BigNumber>;
}

async function queryBadgeLevel({
  address,
  contractAddress,
  rpcUrl,
}: {
  address: string;
  contractAddress: string;
  rpcUrl: string;
}): Promise<number> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

  const badgeContract = new ethers.Contract(contractAddress, BADGE_CONTRACT_ABI, provider) as BadgeContract;

  try {
    const level: BigNumber = await badgeContract.badgeLevel(address);
    return level.toNumber();
  } catch (e) {
    throw new Error(`Error querying badge level: ${e}`);
  }
}

export const scrollDevBadgeHandler = (req: Request, res: Response): void => {
  try {
    console.log("Processing scroll badge request");
    const { credentials, nonce, chainIdHex } = req.body as EasRequestBody;
    if (!Object.keys(onchainInfo).includes(chainIdHex)) {
      return void errorRes(res, `No onchainInfo found for chainId ${chainIdHex}`, 404);
    }
    const attestationChainIdHex = chainIdHex as keyof typeof onchainInfo;

    if (!credentials.length) return void errorRes(res, "No stamps provided", 400);

    const recipient = credentials[0].credentialSubject.id.split(":")[4];

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    if (!credentials.every((credential) => credential.credentialSubject.id.split(":")[4] === recipient))
      return void errorRes(res, "Every credential's id must be equivalent", 400);

    console.log("A");
    Promise.all(
      credentials.map(async (credential) => {
        console.log(
          "Verifying credential",
          credential,
          hasValidIssuer(credential.issuer),
          await verifyCredential(DIDKit, credential)
        );
        return {
          credential,
          verified: hasValidIssuer(credential.issuer) && (await verifyCredential(DIDKit, credential)),
        };
      })
    )
      .then(async (credentialVerifications) => {
        const SCROLL_BADGE_PROVIDER_INFO: Record<
          string,
          {
            contractAddress: string;
            level: number;
          }
        > = JSON.parse(process.env.SCROLL_BADGE_PROVIDER_INFO);

        const badgeProviders = Object.keys(SCROLL_BADGE_PROVIDER_INFO);
        console.log("B");

        const invalidCredentials = credentialVerifications
          .filter(
            ({ verified, credential }) => !verified || !badgeProviders.includes(credential.credentialSubject.provider)
          )
          .map(({ credential }) => credential);

        console.log("badgeProviders", badgeProviders);
        console.log(JSON.stringify(invalidCredentials, null, 2));
        if (invalidCredentials.length > 0) {
          return void errorRes(res, { invalidCredentials }, 400);
        }

        console.log("C");

        const groupedCredentialInfo = credentialVerifications.reduce(
          (acc, { credential }) => {
            const provider = credential.credentialSubject.provider;
            const { contractAddress, level } = SCROLL_BADGE_PROVIDER_INFO[provider];

            if (!acc[contractAddress]) acc[contractAddress] = [];

            const hash = "0x" + Buffer.from(credential.credentialSubject.hash.split(":")[1], "base64").toString("hex");

            acc[contractAddress].push({
              hash,
              level,
            });
            return acc;
          },
          {} as Record<
            string,
            {
              hash: string;
              level: number;
            }[]
          >
        );

        console.log({ groupedCredentialInfo });

        const rpcUrl = getScrollRpcUrl({ chainIdHex: attestationChainIdHex });
        const onchainBadgeData = await Promise.all(
          Object.keys(groupedCredentialInfo).map(async (contractAddress) => {
            const onchainLevel = await queryBadgeLevel({ address: recipient, contractAddress, rpcUrl });
            return { contractAddress, onchainLevel };
          })
        );

        const badgeRequestData = onchainBadgeData
          .map(({ contractAddress, onchainLevel }) => {
            const credentialInfo = groupedCredentialInfo[contractAddress];

            const credentialLevels = credentialInfo.map(({ level }) => level);
            const maxCredentialLevel = Math.max(...credentialLevels);

            // TODO dynamic schema and data for new vs upgrade
            // const isUpgrade = onchainLevel > 0;

            const requiredLevels = [...Array(maxCredentialLevel).keys()]
              .map((n) => n + 1)
              .filter((n) => n > onchainLevel && credentialLevels.includes(n));

            // All credentials already claimed
            if (requiredLevels.length === 0) return;

            requiredLevels.forEach((level) => {
              if (!credentialLevels.includes(level)) {
                throw new Error(`Missing credential for level ${level}, contract ${contractAddress}`);
              }
            });

            const hashes = credentialInfo.filter(({ level }) => requiredLevels.includes(level)).map(({ hash }) => hash);

            console.log({ contractAddress, maxCredentialLevel, hashes });

            const data = BADGE_SCHEMA_ENCODER.encodeData([
              { name: "badge", value: contractAddress, type: "address" },
              {
                name: "payload",
                type: "bytes",
                value: BADGE_PAYLOAD_SCHEMA_ENCODER.encodeData([
                  { name: "level", value: maxCredentialLevel, type: "uint256" },
                  { name: "hashes", value: hashes, type: "bytes32[]" },
                ]),
              },
            ]);

            return {
              ...DEFAULT_REQUEST_DATA,
              recipient,
              data,
            };
          })
          .filter(Boolean);

        console.log({ badgeRequestData });
        if (badgeRequestData.length === 0) {
          return void errorRes(res, "All badges already claimed", 400);
        }

        const multiAttestationRequest: MultiAttestationRequest[] = [
          {
            schema: process.env.SCROLL_BADGE_ATTESTATION_SCHEMA_UID,
            data: badgeRequestData,
          },
        ];

        const fee = await getEASFeeAmount(1);
        const passportAttestation: PassportAttestation = {
          multiAttestationRequest,
          nonce: Number(nonce),
          fee: fee.toString(),
        };

        console.log("passportAttestation", JSON.stringify(passportAttestation, null, 2));

        const domainSeparator = getAttestationDomainSeparator(attestationChainIdHex);

        const signer = await getAttestationSignerForChain(attestationChainIdHex);

        signer
          ._signTypedData(domainSeparator, ATTESTER_TYPES, passportAttestation)
          .then((signature) => {
            const { v, r, s } = utils.splitSignature(signature);

            console.log({ v, r, s });

            const payload: EasPayload = {
              passport: passportAttestation,
              signature: { v, r, s },
              invalidCredentials,
            };

            return void res.json(payload);
          })
          .catch((e) => {
            console.log("Error signing badge request", { e });
            return void errorRes(res, "Error signing badge request", 500);
          });
      })
      .catch((e) => {
        console.log("Error formatting badge request", { e });
        return void errorRes(res, "Error formatting badge request", 500);
      });
  } catch (error) {
    console.log("Unexpected error when processing scroll badge request", { error });
    return void errorRes(res, String(error), 500);
  }
};
