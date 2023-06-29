import { Contract } from "ethers";
import { EVM_CHAIN_CONFIG, SupportedChain } from "./evmChainConfig";
import { CivicPassType } from "./passType";
import { Provider as EthersProvider } from "@ethersproject/abstract-provider";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import { GATEWAY_PROTOCOL_ABI } from "./gatewayProtocolABI";

const isError = (e: unknown): e is Error => e instanceof Error;
export const errorToString = (e: unknown): string => (isError(e) ? e.message : JSON.stringify(e));
type PassDetails = {
  expiry: BigNumber;
  identifier: BigNumber;
};
type Pass = PassDetails & {
  type: CivicPassType;
  chain: SupportedChain;
};
type PassLookupError = { type: CivicPassType; chain: SupportedChain; error: string };
type PassResponse = { pass?: Pass; error?: PassLookupError };
// Gateway Protocol Contract Address
const GATEWAY_PROTOCOL_CONTRACT_ADDRESS = "0xF65b6396dF6B7e2D8a6270E3AB6c7BB08BAEF22E";
/* eslint-disable @typescript-eslint/no-unsafe-call */

// Check for the existence of a particular pass on a chain
async function findPass(
  ethersProvider: EthersProvider,
  userAddress: string,
  passType: CivicPassType
): Promise<PassDetails | undefined> {
  const contract = new Contract(GATEWAY_PROTOCOL_CONTRACT_ADDRESS, GATEWAY_PROTOCOL_ABI, ethersProvider);

  const tokenIds: BigNumber[] = await contract.getTokenIdsByOwnerAndNetwork(userAddress, passType, true);

  // accept the first active pass
  if (tokenIds.length === 0) return undefined;

  const pass: { expiration: BigNumber } = await contract.getToken(tokenIds[0]);

  return {
    expiry: pass.expiration,
    identifier: tokenIds[0],
  };
}

/**
 * Find all passes for a given user address. This function will iterate over all supported chains
 * in parallel and check for each supported pass on each chain. Errors are collected and returned together
 * @param userAddress The address of the user to find the passes for
 * @param chains An array of chains to filter the search to.
 * @param passTypes An array of pass types to filter the search to.
 */
export async function findAllPasses(
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
        const passDetails = await findPass(ethersProvider, userAddress, passType);
        return passDetails ? { pass: { type: passType, chain, ...passDetails } } : null;
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

export const latestExpiry = (passes: Pass[]): BigNumber =>
  passes.reduce((max, pass) => (pass.expiry.gt(max) ? pass.expiry : max), BigNumber.from(0));

export const secondsFromNow = (expiry: BigNumber): number =>
  expiry.sub(BigNumber.from(Math.floor(Date.now() / 1000))).toNumber();
