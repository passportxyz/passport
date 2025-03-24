import { Request } from "express";
import { Signature } from "ethers";
import { Response } from "express";
import {
  EasPayload,
  PassportAttestation,
  EasRequestBody,
} from "@gitcoin/passport-types";
import { getEASFeeAmount } from "../utils/easFees.js";
import passportOnchainInfo from "../../../deployments/onchainInfo.json" with { type: "json" };
import { errorRes, addErrorDetailsToMessage } from "../utils/helpers.js";
import {
  ATTESTER_TYPES,
  getAttestationDomainSeparator,
  getAttestationSignerForChain,
} from "../utils/attestations.js";
import { toJsonObject } from "../utils/json.js";
import { generateScoreAttestationRequest } from "../utils/easScoreSchema.js";

const EAS_FEE_USD = parseFloat(process.env.EAS_FEE_USD);

const isChainIdHexValid = (
  value: string,
): value is keyof typeof passportOnchainInfo =>
  Object.keys(passportOnchainInfo).includes(value);

export const easScoreV2Handler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { recipient, nonce, chainIdHex, customScorerId } =
      req.body as EasRequestBody;

    if (!isChainIdHexValid(chainIdHex)) {
      return void errorRes(
        res,
        `No onchainInfo found for chainId ${chainIdHex}`,
        404,
      );
    }

    if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
      return void errorRes(res, "Invalid recipient", 400);

    const scoreAttestationRequest = await generateScoreAttestationRequest({
      recipient,
      chainIdHex,
      customScorerId,
    });

    const fee = await getEASFeeAmount(EAS_FEE_USD);
    const scoreAttestation: PassportAttestation = {
      multiAttestationRequest: scoreAttestationRequest,
      nonce: Number(nonce),
      fee: fee.toString(),
    };

    const domainSeparator = getAttestationDomainSeparator(chainIdHex);

    const signer = await getAttestationSignerForChain(chainIdHex);

    const signature = await signer.signTypedData(
      domainSeparator,
      ATTESTER_TYPES,
      scoreAttestation,
    );
    const { v, r, s } = Signature.from(signature);

    const payload: EasPayload = {
      passport: scoreAttestation,
      signature: { v, r, s },
      invalidCredentials: [],
    };

    return void res.json(toJsonObject(payload));
  } catch (error) {
    const message = addErrorDetailsToMessage(
      "Unexpected error generating score attestation",
      error,
    );
    return void errorRes(res, message, 500);
  }
};
