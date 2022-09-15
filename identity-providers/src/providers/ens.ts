import { VerifiedPayload, IdentityProviders, VerifiedProvider, ProviderPayload } from "../utils/identityProviders";
import { ProviderContext } from "@gitcoin/passport-types";

// ----- Ethers library
import { utils } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// set the network rpc url based on env
const RPC_URL = process.env.RPC_URL;

export class ENSIdentityProvider implements VerifiedProvider {
  type = "ENS";

  async verify(payload: ProviderPayload, context: ProviderContext): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const { address } = payload;

    try {
      // define a provider using the rpc url
      const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(RPC_URL);

      // lookup ens name
      const reportedName: string | null = await provider.lookupAddress(address);
      if (!reportedName) return { valid: false, error: ["Ens name was not found for given address."] };

      // lookup the address resolved to an ens name
      const resolveAddress = await provider.resolveName(reportedName);

      // if the addresses match this is a valid ens lookup
      const valid = utils.getAddress(payload.address) === utils.getAddress(resolveAddress);

      return {
        valid: valid,
        record: {
          ens: valid ? reportedName : undefined,
        },
      };
    } catch (e) {
      return {
        valid: false,
      };
    }
  }
}
