import type { Provider } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

import { Contract } from "ethers";
import { Provider as EthersProvider, StaticJsonRpcProvider } from "@ethersproject/providers";
import { GATEWAY_PROTOCOL_ABI } from "./gatewayProtocolABI";
import { CivicPassType, supportedCivicPassTypes } from "./passType";
import { EVM_CHAIN_CONFIG, SupportedChain } from "./evmChainConfig";
import { errorToString } from "./util";

type Pass = {
  type: CivicPassType;
  chain: SupportedChain;
};
type PassLookupError = { type: CivicPassType; chain: SupportedChain; error: string };
type PassResponse = { pass?: Pass; error?: PassLookupError };

// Gateway Protocol Contract Address
const GATEWAY_PROTOCOL_CONTRACT_ADDRESS = "0xF65b6396dF6B7e2D8a6270E3AB6c7BB08BAEF22E";

// Check for the existence of a particular pass on a chain
function hasPass(ethersProvider: EthersProvider, userAddress: string, passType: CivicPassType): Promise<boolean> {
  const contract = new Contract(GATEWAY_PROTOCOL_CONTRACT_ADDRESS, GATEWAY_PROTOCOL_ABI, ethersProvider);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
  return contract.verifyToken(userAddress, passType);
}

/**
 * Find all passes for a given user address. This function will iterate over all supported chains
 * in parallel and check for each supported pass on each chain. Errors are collected and returned together
 * @param userAddress The address of the user to find the passes for
 * @param chains An array of chains to filter the search to.
 * @param passTypes An array of pass types to filter the search to.
 */
async function findAllPasses(
  userAddress: string,
  chains: SupportedChain[],
  passTypes: CivicPassType[]
): Promise<PassResponse[]> {
  // Given a chain and the provider that is connected to it,
  // return a function that will check for the existence of a pass on that chain
  const getPassResponseForChain =
    (chain: SupportedChain, ethersProvider: EthersProvider) =>
    async (passType: CivicPassType): Promise<PassResponse | null> => {
      try {
        const hasPassOnChain = await hasPass(ethersProvider, userAddress, passType);
        return hasPassOnChain ? { pass: { type: passType, chain } } : null;
      } catch (e) {
        return { error: { type: passType, chain, error: errorToString(e) } };
      }
    };

  // A reducer that takes an array of pass responses and add the pass responses for a given chain
  const passReducer = (
    passResponses: Promise<PassResponse | null>[],
    chain: SupportedChain
  ): Promise<PassResponse | null>[] => {
    const { rpcUrl } = EVM_CHAIN_CONFIG[chain];
    const ethersProvider: StaticJsonRpcProvider = new StaticJsonRpcProvider(rpcUrl);
    const passResponsesForChain = passTypes.map(getPassResponseForChain(chain, ethersProvider));
    return [...passResponses, ...passResponsesForChain];
  };

  // iterate over all supported chains and check for passes
  const responses = await Promise.all(chains.reduce(passReducer, []));

  // remove nulls (representing "no pass of type x on chain y") from the array
  return responses.filter((response) => response !== null);
}

type CivicPassProviderOptions = {
  chains?: SupportedChain[];
  passTypes?: CivicPassType[];
  type?: string;
  includeTestnets?: boolean;
};

// Export a Civic Pass Provider
export class CivicPassProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Civic";

  // Options can be set here and/or via the constructor
  _options = {
    chains: Object.keys(EVM_CHAIN_CONFIG) as SupportedChain[],
    passTypes: supportedCivicPassTypes,
    type: "CivicAllPasses",
    includeTestnets: false,
  };

  // construct the provider instance with supplied options
  constructor(options: CivicPassProviderOptions = {}) {
    this._options = { ...this._options, ...options };
    this.type = options.type;
    // filter unsupported chains or non-mainnet chains (if includeTestnets is false)
    this._options.chains = this._options.chains.filter(
      (chain) => EVM_CHAIN_CONFIG[chain] && (this._options.includeTestnets || EVM_CHAIN_CONFIG[chain].mainnet)
    );
  }

  // Verify that address defined in the payload has a civic pass
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    const passResponses = await findAllPasses(address, this._options.chains, this._options.passTypes);

    const error = passResponses
      .map((response) => response.error?.error)
      .filter((errorMessage) => errorMessage !== undefined);
    const passes = passResponses.map((response) => response.pass).filter((pass) => pass !== undefined);
    const valid = passes.length > 0;

    // convert the passes found to a record data structure of the form:
    // "passType": "chain1,chain2"
    // e.g. "UNIQUENESS": "ETHEREUM_MAINNET,POLYGON_POS_MAINNET"
    const recordData = passes.reduce((acc, pass) => {
      const passData = acc[CivicPassType[pass.type]] || "";

      return {
        ...acc,
        [CivicPassType[pass.type]]: `${passData}${passData ? "," : ""}${pass.chain}`,
      };
    }, {} as Record<string, string>);

    return {
      valid,
      error,
      record: valid
        ? {
            address: address,
            ...recordData,
          }
        : {},
    };
  }
}
