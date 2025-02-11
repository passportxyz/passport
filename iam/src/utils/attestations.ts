import passportOnchainInfo from "../../../deployments/onchainInfo.json" with { type: "json" };
import { Wallet, TypedDataDomain } from "./ethersHelper.js";

export const getAttestationDomainSeparator = (chainIdHex: keyof typeof passportOnchainInfo): TypedDataDomain => {
  const verifyingContract = passportOnchainInfo[chainIdHex].GitcoinVerifier.address;
  const chainId = parseInt(chainIdHex, 16).toString();
  return {
    name: "GitcoinVerifier",
    version: "1",
    chainId,
    verifyingContract,
  };
};

export const ATTESTER_TYPES = {
  AttestationRequestData: [
    { name: "recipient", type: "address" },
    { name: "expirationTime", type: "uint64" },
    { name: "revocable", type: "bool" },
    { name: "refUID", type: "bytes32" },
    { name: "data", type: "bytes" },
    { name: "value", type: "uint256" },
  ],
  MultiAttestationRequest: [
    { name: "schema", type: "bytes32" },
    { name: "data", type: "AttestationRequestData[]" },
  ],
  PassportAttestationRequest: [
    { name: "multiAttestationRequest", type: "MultiAttestationRequest[]" },
    { name: "nonce", type: "uint256" },
    { name: "fee", type: "uint256" },
  ],
};

// Wallet to use for mainnets
// Only functional in production (set to same as testnet for non-production environments)
const productionAttestationSignerWallet = new Wallet(process.env.ATTESTATION_SIGNER_PRIVATE_KEY);
// Wallet to use for testnets
const testAttestationSignerWallet = new Wallet(process.env.TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY);

export const getAttestationSignerForChain = async (chainIdHex: keyof typeof passportOnchainInfo): Promise<Wallet> => {
  const productionAttestationIssuerAddress = await productionAttestationSignerWallet.getAddress();
  const chainUsesProductionIssuer =
    passportOnchainInfo[chainIdHex].issuer.address.toLowerCase() === productionAttestationIssuerAddress.toLowerCase();

  return chainUsesProductionIssuer ? productionAttestationSignerWallet : testAttestationSignerWallet;
};
