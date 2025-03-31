import { Signature } from "ethers";
import { EasPayload, PassportAttestation, EasRequestBody, EasResponseBody } from "@gitcoin/passport-types";
import { getEASFeeAmount } from "../utils/easFees.js";
import passportOnchainInfo from "../../../deployments/onchainInfo.json" with { type: "json" };
import { ATTESTER_TYPES, getAttestationDomainSeparator, getAttestationSignerForChain } from "../utils/attestations.js";
import { toJsonObject } from "../utils/json.js";
import { generateScoreAttestationRequest } from "../utils/easScoreSchema.js";
import { serverUtils } from "../utils/identityHelper.js";

const { ApiError, createHandler } = serverUtils;

const EAS_FEE_USD = parseFloat(process.env.EAS_FEE_USD);

const isChainIdHexValid = (value: string): value is keyof typeof passportOnchainInfo =>
  Object.keys(passportOnchainInfo).includes(value);

export const easScoreV2Handler = createHandler<EasRequestBody, EasResponseBody>(async (req, res) => {
  const { recipient, nonce, chainIdHex, customScorerId } = req.body;

  if (!isChainIdHexValid(chainIdHex)) {
    throw new ApiError(`No onchainInfo found for chainId ${chainIdHex}`, "400_BAD_REQUEST");
  }

  if (!(recipient && recipient.length === 42 && recipient.startsWith("0x")))
    throw new ApiError("Invalid recipient", "400_BAD_REQUEST");

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

  const signature = await signer.signTypedData(domainSeparator, ATTESTER_TYPES, scoreAttestation);
  const { v, r, s } = Signature.from(signature);

  const payload: EasPayload = {
    passport: scoreAttestation,
    signature: { v, r, s },
    invalidCredentials: [],
  };

  return void res.json(toJsonObject(payload));
});
