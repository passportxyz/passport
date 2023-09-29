/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */

import { authenticate, loadIdenaSession } from "../procedures/idenaSignIn";
import { clearCacheSession, initCacheSession, loadCacheSession } from "../../utils/cache";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0x5867b46bd12769e0b7522a5b64acd7c1eacb183a";
const MOCK_SESSION_KEY = "sessionKey";
const MOCK_NONCE = "signin-nonce";
const MOCK_SIGNATURE = "signature";

type IdenaCache = {
  address?: string;
  nonce?: string;
  signature?: string;
};

const signatureAddressResponse = {
  data: { result: MOCK_ADDRESS },
  status: 200,
};

beforeEach(() => {
  initCacheSession(MOCK_SESSION_KEY);

  mockedAxios.get.mockImplementation(async (url, config) => {
    switch (url) {
      case `/api/SignatureAddress?value=${MOCK_NONCE}&signature=${MOCK_SIGNATURE}`:
        return signatureAddressResponse;
    }
  });

  mockedAxios.create = jest.fn(() => mockedAxios);
});

afterEach(() => {
  clearCacheSession(MOCK_SESSION_KEY, "Idena");
  jest.clearAllMocks();
});

describe("Attempt signin", function () {
  it("should generate nonce", () => {
    const nonce = loadIdenaSession(MOCK_SESSION_KEY, MOCK_ADDRESS);
    expect(nonce).toBeDefined();

    const session: IdenaCache = loadCacheSession(MOCK_SESSION_KEY, "Idena");
    expect(session).toBeDefined();
    expect(session.nonce).toBe(nonce);
    expect(session.address).toBe(MOCK_ADDRESS);
    expect(session.signature).toBeUndefined();
  });

  it("shouldn't generate nonce for wrong session", () => {
    expect(() => loadIdenaSession("wrong_session_key", MOCK_ADDRESS)).toThrow("Session missing or expired, try again");
  });

  it("should authenticate", async () => {
    const session: IdenaCache = loadCacheSession(MOCK_SESSION_KEY, "Idena");
    session.address = MOCK_ADDRESS;
    session.nonce = MOCK_NONCE;

    const ok = await authenticate(MOCK_SESSION_KEY, MOCK_SIGNATURE);

    expect(ok).toBe(true);
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`/api/SignatureAddress?value=${MOCK_NONCE}&signature=${MOCK_SIGNATURE}`);
    expect(session).toBeDefined();
    expect(session.address).toBe(MOCK_ADDRESS);
    expect(session.signature).toBe(MOCK_SIGNATURE);
  });

  it("shouldn't authenticate when the Idena API returns wrong response", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      throw new Error("error");
    });

    const session: IdenaCache = loadCacheSession(MOCK_SESSION_KEY, "Idena");
    session.address = MOCK_ADDRESS;
    session.nonce = MOCK_NONCE;

    const ok = await authenticate(MOCK_SESSION_KEY, MOCK_SIGNATURE);

    expect(ok).toBe(false);
    expect(session).toBeDefined();
    expect(session.address).toBe(MOCK_ADDRESS);
    expect(session.signature).toBeUndefined();
  });

  it("shouldn't authenticate when session has no nonce data", async () => {
    const ok = await authenticate(MOCK_SESSION_KEY, MOCK_SIGNATURE);

    expect(ok).toBe(false);
    const session: IdenaCache = loadCacheSession(MOCK_SESSION_KEY, "Idena");
    expect(session).toBeDefined();
    expect(session.address).toBeUndefined();
    expect(session.nonce).toBeUndefined();
    expect(session.signature).toBeUndefined();
  });
});
