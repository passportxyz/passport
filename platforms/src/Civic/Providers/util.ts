import { CivicPassLookupPass, CivicPassLookupResponse, CivicPassType, Pass, SupportedChain } from "./types.js";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

const CIVIC_URL = "https://api.civic.com/pass-lookup";

const isError = (e: unknown): e is Error => e instanceof Error;
export const errorToString = (e: unknown): string => (isError(e) ? e.message : JSON.stringify(e));

export const latestExpiry = (passes: Pass[]): bigint =>
  passes.reduce((max, pass) => (pass.expiry > max ? pass.expiry : max), BigInt(0));

export const getNowAsBigNumberSeconds = () => BigInt(Math.floor(Date.now() / 1000));

export const secondsFromNow = (expiry: bigint): number => Number(expiry - getNowAsBigNumberSeconds());

const passLookupResponseToPass =
  (passType: CivicPassType) =>
  (pass: CivicPassLookupPass): Pass => ({
    type: passType,
    chain: pass.chain as SupportedChain,
    expiry: BigInt(pass.expiry),
    identifier: pass.identifier,
    state: pass.state,
  });

const passTypesToNames = (passTypes: CivicPassType[]): string[] => passTypes.map((id) => CivicPassType[id]);

/**
 * Look up all passes for a user's address.
 * The endpoint supports DID-lookup as well as looking up passes by an individual wallet.
 * If a DID is passed, the endpoint will look up all passes for all wallets associated with that DID.
 * This function distills responses for all wallets down to an array of passes.
 *
 * An example multi-wallet response is:
 * {
 *   "wallet1": {
 *     "passes": {
 *       "UNIQUENESS": [
 *         {
 *           "type": {
 *             "slotId": 10,
 *             "address": "uniqobk8oGh4XBLMqM68K8M2zNu3CdYX7q5go7whQiv",
 *             "name": "UNIQUENESS",
 *             "isTest": false
 *           },
 *           "chain": "SOLANA_MAINNET",
 *           "identifier": "id",
 *           "expiry": 2522158024,
 *           "state": "ACTIVE"
 *         },
 *       ],
 *       "IDV": [
 *         {
 *           "type": {
 *             "slotId": 6,
 *             "address": "bni1ewus6aMxTxBi5SAfzEmmXLf8KcVFRmTfproJuKw",
 *             "name": "IDV",
 *             "isTest": false
 *           },
 *           "chain": "SOLANA_DEVNET",
 *           "identifier": "ud",
 *           "state": "ACTIVE"
 *         }
 *       ]
 *     },
 *     "errors": []
 *   },
 *   "wallet2": {
 *     "passes": {
 *       "UNIQUENESS": [
 *         {
 *           "type": {
 *             "slotId": 10,
 *             "address": "uniqobk8oGh4XBLMqM68K8M2zNu3CdYX7q5go7whQiv",
 *             "name": "UNIQUENESS",
 *             "isTest": false
 *           },
 *           "chain": "POLYGON_POS_MAINNET",
 *           "identifier": "id",
 *           "expiry": 2548930330,
 *           "state": "ACTIVE"
 *         }
 *       ]
 *     },
 *     "errors": []
 *   }
 * }
 * @param userAddress
 * @param includeTestnets
 * @param passTypes
 */
export const findAllPasses = async (
  userAddress: string,
  includeTestnets = false,
  passTypes?: CivicPassType[]
): Promise<Pass[]> => {
  const queryString = getQueryString(passTypes, userAddress, includeTestnets);
  const response = await requestPasses(queryString);
  return Object.entries(response).flatMap(([, passesForAddress]) =>
    Object.entries(passesForAddress.passes).flatMap(([passType, passes]) =>
      passes.flatMap(passLookupResponseToPass(CivicPassType[passType as keyof typeof CivicPassType]))
    )
  );
};

const getQueryString = (passTypes: CivicPassType[], userAddress: string, includeTestnets: boolean): string => {
  const passTypesString = passTypes ? `&passTypes=${passTypesToNames(passTypes).join(",")}` : "";
  return `${CIVIC_URL}/${userAddress}?includeExpired=true&includeTestnets=${includeTestnets.toString()}${passTypesString}`;
};

const requestPasses = async (queryString: string): Promise<CivicPassLookupResponse> => {
  try {
    const response = await axios.get<CivicPassLookupResponse>(queryString);
    return response.data;
  } catch (e) {
    handleProviderAxiosError(e, "Civic");
  }
};
