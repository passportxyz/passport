import crypto from "crypto";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { initCacheSession, loadCacheSession, clearCacheSession } from "../../utils/cache";
import { ProviderContext } from "@gitcoin/passport-types";

type IdenaCache = {
  address?: string;
  nonce?: string;
  signature?: string;
};

const loadIdenaCache = (token: string): IdenaCache => loadCacheSession(token, "Idena");

// Idena API url
const API_URL = "https://api.idena.io/";

const generateToken = (): string => {
  return `idena-${crypto.randomBytes(32).toString("hex")}`;
};

const generateNonce = (): string => {
  return `signin-${crypto.randomBytes(32).toString("hex")}`;
};

export const initSession = (): string => {
  const token = initCacheSession(generateToken());
  return token;
};

export const loadIdenaSession = (token: string, address: string): string | undefined => {
  const session = loadIdenaCache(token);
  const nonce = generateNonce();

  session.nonce = nonce;
  session.address = address;

  return nonce;
};

export const authenticate = async (token: string, signature: string): Promise<boolean> => {
  const session = loadIdenaCache(token);
  if (!session.address || session.signature) {
    return false;
  }
  let address;
  try {
    address = await requestSignatureAddress(session.nonce, signature);
  } catch (e) {
    return false;
  }
  if (!address || address.toLowerCase() !== session.address.toLowerCase()) {
    return false;
  }
  session.signature = signature;
  return true;
};

type SignatureAddressResponse = {
  result: string;
};

type EpochResponse = {
  result: { validationTime: string };
};

type IdentityResponse = {
  result: { state: string };
  address: string;
};

type IdentityAgeResponse = {
  result: string;
  address: string;
};

type AddressResponse = {
  result: { stake: string };
  address: string;
};

type IdenaMethod =
  | "/api/epoch/last"
  | "/api/identity/_address_"
  | "/api/identity/_address_/age"
  | "/api/address/_address_";

export type IdenaContext = ProviderContext & {
  idena: {
    address?: string;
    responses: {
      [key in IdenaMethod]?: AxiosResponse;
    };
  };
};

const requestSignatureAddress = async (nonce: string, signature: string): Promise<string> => {
  const response: { data: SignatureAddressResponse } = await apiClient().get(
    `/api/SignatureAddress?value=${nonce}&signature=${signature}`
  );
  return response.data.result;
};

const requestValidationTime = async (token: string, context: IdenaContext): Promise<string> => {
  const data: EpochResponse = await request(token, context, "/api/epoch/last");
  return data.result.validationTime;
};

export const requestIdentityState = async (
  token: string,
  context: IdenaContext
): Promise<{ address: string; state: string; expirationDate: string }> => {
  const data: IdentityResponse = await request(token, context, "/api/identity/_address_");
  const expirationDate = await requestValidationTime(token, context);
  return { address: data.address, state: data.result.state, expirationDate };
};

export const requestIdentityAge = async (
  token: string,
  context: IdenaContext
): Promise<{ address: string; age: number; expirationDate: string }> => {
  const data: IdentityAgeResponse = await request(token, context, "/api/identity/_address_/age");
  const expirationDate = await requestValidationTime(token, context);
  return { address: data.address, age: +data.result, expirationDate };
};

export const requestIdentityStake = async (
  token: string,
  context: IdenaContext
): Promise<{ address: string; stake: number; expirationDate: string }> => {
  const data: AddressResponse = await request(token, context, "/api/address/_address_");
  const expirationDate = await requestValidationTime(token, context);
  return { address: data.address, stake: +data.result.stake, expirationDate };
};

const apiClient = (): AxiosInstance => {
  return axios.create({
    baseURL: API_URL,
  });
};

const loadSessionAddress = (token: string, context: IdenaContext): string => {
  if (!context.idena) context.idena = { responses: {} };
  if (!context.idena.address) {
    const session = loadIdenaCache(token);
    if (!session.address || !session.signature) {
      throw "Invalid session, unable to retrieve authenticated address";
    }
    context.idena.address = session.address;
    clearCacheSession(token, "Idena");
  }
  return context.idena.address;
};

const request = async <T>(token: string, context: IdenaContext, method: IdenaMethod): Promise<T> => {
  const address = loadSessionAddress(token, context);

  let response = context.idena.responses[method];
  if (!response) {
    response = await apiClient().get(method.replace("_address_", address));
    context.idena.responses[method] = response;
  }

  if (response.status != 200) {
    throw `get ${method} returned status code ${response.status} instead of the expected 200`;
  }

  return { ...response.data, address: address } as T;
};
