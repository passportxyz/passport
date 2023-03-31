// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import type { Provider, ProviderOptions } from "../../types";
import { Contract, BigNumber } from "ethers";

// ----- Credential verification
import { getAddress } from "../../utils/signer";

//NFCS contract address
const POLYGON_NFCS_ADDRESS = "0x839a06a50A087fe3b842DF1877Ef83A443E37FbE";

//NFCS interface
const NFCS_ABI = [
  {
    inputs: [{ internalType: "address", name: "tokenOwner", type: "address" }],
    name: "getToken",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

//Checks user owns NFCS token
async function isOwnsNfcs(userAddress: string): Promise<boolean> {
  const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(
    process.env.POLYGON_RPC_URL || "https://polygon-rpc.com"
  );

  const nfcs = new Contract(POLYGON_NFCS_ADDRESS, NFCS_ABI, provider);

  let hasNfcs = false;

  try {
    //Will throw in case user haven't NFCS token
    const getToken = nfcs.getToken as (address: string) => Promise<BigNumber>;
    await getToken(userAddress);
    hasNfcs = true;
  } catch {}

  return hasNfcs;
}

// Export a RociFi provider
export class RociFiProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "RociFi";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload owns at least one POAP older than 15 days
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = (await getAddress(payload)).toLowerCase();

    const valid = await isOwnsNfcs(address);

    return Promise.resolve({
      valid,
      record: valid
        ? {
            address: address,
          }
        : undefined,
    });
  }
}
