/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/require-await */

import { RequestPayload } from "@gitcoin/passport-types";
import { IdenaContext } from "../procedures/idenaSignIn.js";
import { initCacheSession, loadCacheSession } from "../../utils/platform-cache.js";
import {
  IdenaStateHumanProvider,
  IdenaStateNewbieProvider,
  IdenaStateVerifiedProvider,
} from "../Providers/IdenaStateProvider.js";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0x5867b46bd12769e0b7522a5b64acd7c1eacb183a";
const MOCK_SESSION_KEY = "sessionKey";

const ageResponse = {
  data: { result: 7 },
  status: 200,
};

const identityResponse = {
  data: { result: { state: "Human" } },
  status: 200,
};

const addressResponse = {
  data: { result: { stake: "105000.123" } },
  status: 200,
};

const lastEpochResponse = {
  data: {
    result: {
      validationTime: "2023-01-02T00:00:01Z",
    },
  },
  status: 200,
};

type IdenaCache = {
  address?: string;
  signature?: string;
};

describe("Idena", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2023, 0, 1)));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    await initCacheSession(MOCK_SESSION_KEY);
    const session = await loadCacheSession<IdenaCache>(MOCK_SESSION_KEY);
    await session.set("address", MOCK_ADDRESS);
    await session.set("signature", "signature");

    mockedAxios.get.mockImplementation(async (url, config) => {
      switch (url) {
        case `/api/identity/${MOCK_ADDRESS}/age`:
          return ageResponse;
        case `/api/identity/${MOCK_ADDRESS}`:
          return identityResponse;
        case `/api/address/${MOCK_ADDRESS}`:
          return addressResponse;
        case "/api/epoch/last":
          return lastEpochResponse;
      }
    });

    mockedAxios.create = jest.fn(() => mockedAxios);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Check valid cases for state providers", function () {
    it("Expected Human state", async () => {
      const provider = new IdenaStateHumanProvider();
      const payload = {
        proofs: {
          sessionKey: MOCK_SESSION_KEY,
        },
      };
      const verifiedPayload = await provider.verify(payload as unknown as RequestPayload, {} as IdenaContext);

      expect(verifiedPayload).toEqual({
        valid: true,
        record: {
          address: MOCK_ADDRESS,
          state: "Human",
        },
        expiresInSeconds: 86401,
      });
    });

    it("Expected Newbie state", async () => {
      identityResponse.data.result.state = "Newbie";
      const provider = new IdenaStateNewbieProvider();
      const payload = {
        proofs: {
          sessionKey: MOCK_SESSION_KEY,
        },
      };
      const verifiedPayload = await provider.verify(payload as unknown as RequestPayload, {} as IdenaContext);

      expect(verifiedPayload).toEqual({
        valid: true,
        record: {
          address: MOCK_ADDRESS,
          state: "Newbie",
        },
        expiresInSeconds: 86401,
      });
    });

    it("Incorrect state", async () => {
      identityResponse.data.result.state = "Newbie";
      const provider = new IdenaStateVerifiedProvider();
      const payload = {
        proofs: {
          sessionKey: MOCK_SESSION_KEY,
        },
      };
      const verifiedPayload = await provider.verify(payload as unknown as RequestPayload, {} as IdenaContext);

      expect(verifiedPayload).toEqual(
        expect.objectContaining({
          valid: false,
          errors: [`State "${identityResponse.data.result.state}" does not match acceptable state(s) Verified, Human`],
        })
      );
    });

    it("Expected Verified state", async () => {
      identityResponse.data.result.state = "Verified";
      const provider = new IdenaStateVerifiedProvider();
      const payload = {
        proofs: {
          sessionKey: MOCK_SESSION_KEY,
        },
      };
      const verifiedPayload = await provider.verify(payload as unknown as RequestPayload, {} as IdenaContext);

      expect(verifiedPayload).toEqual({
        valid: true,
        record: {
          address: MOCK_ADDRESS,
          state: "Verified",
        },
        expiresInSeconds: 86401,
      });
    });

    it("Higher states acceptable for lower state stamps", async () => {
      identityResponse.data.result.state = "Human";
      const provider = new IdenaStateVerifiedProvider();
      const payload = {
        proofs: {
          sessionKey: MOCK_SESSION_KEY,
        },
      };
      const verifiedPayload = await provider.verify(payload as unknown as RequestPayload, {} as IdenaContext);

      expect(verifiedPayload).toEqual({
        valid: true,
        record: {
          address: MOCK_ADDRESS,
          state: "Verified",
        },
        expiresInSeconds: 86401,
      });
    });
  });
});

describe("Idena Error", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(Date.UTC(2023, 0, 1)));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should report errors from the API", async () => {
    await initCacheSession(MOCK_SESSION_KEY);
    const session = await loadCacheSession<IdenaCache>(MOCK_SESSION_KEY);
    await session.set("address", MOCK_ADDRESS);
    await session.set("signature", "signature");

    mockedAxios.get.mockImplementation(async () => ({
      data: { error: { message: "Idena API error" } },
      status: 200,
    }));

    mockedAxios.create = jest.fn(() => mockedAxios);

    const provider = new IdenaStateVerifiedProvider();
    const payload = {
      proofs: {
        sessionKey: MOCK_SESSION_KEY,
      },
    };
    await expect(provider.verify(payload as unknown as RequestPayload, {} as IdenaContext)).rejects.toThrow(
      "Idena API returned error: Idena API error"
    );
  });
});
