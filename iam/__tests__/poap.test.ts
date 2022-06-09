// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { POAPProvider, poapSubgraphs } from "../src/providers/poap";

// ----- Libs
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();

const now = Math.floor(Date.now() / 1000);
const secondsInADay = 3600 * 24;
const daysAgo5 = now - 5 * secondsInADay;
const daysAgo10 = now - 10 * secondsInADay;
const daysAgo14 = now - 14 * secondsInADay;
const daysAgo16 = now - 16 * secondsInADay;

const validPoapResponse = {
  data: {
    data: {
      account: {
        tokens: [
          {
            id: "1",
            created: daysAgo16,
          },
          {
            id: "2",
            created: daysAgo14,
          },
          {
            id: "3",
            created: daysAgo10,
          },
          {
            id: "4",
            created: daysAgo5,
          },
        ],
      },
    },
  },
};

const invalidPoapResponse = {
  data: {
    data: {
      account: {
        tokens: [
          {
            id: "1",
            created: daysAgo14,
          },
          {
            id: "2",
            created: daysAgo10,
          },
          {
            id: "3",
            created: daysAgo5,
          },
        ],
      },
    },
  },
};

const emptyPoapResponse = {
  data: {
    data: {
      account: null as {},
    },
  },
};

// const AxiosPost = jest.spyOn(axios.prototype, "post");

interface RequestData {
  query: string;
}

describe("Attempt verification", function () {
  beforeEach(() => {});

  it("handles valid verification attempt", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    let expectedSubgraphsToCheck = [];
    for (var i = 0; i < poapSubgraphs.length; i++) {
      const subgraphUrl = poapSubgraphs[i];
      expectedSubgraphsToCheck.push(subgraphUrl);
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS_LOWER)) {
          return validPoapResponse;
        }
      });

      const poap = new POAPProvider();
      const verifiedPayload = await poap.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);

      // Check that all the subgraph URLs have been queried, up to the one we mocked with relevant data
      expect(mockedAxios.post.mock.calls.length).toEqual(expectedSubgraphsToCheck.length);
      for (let j = 0; j < expectedSubgraphsToCheck.length; j++) {
        expect(mockedAxios.post.mock.calls[i][0]).toEqual(expectedSubgraphsToCheck[i]);
      }

      expect(verifiedPayload).toEqual({
        valid: true,
        record: {
          address: MOCK_ADDRESS_LOWER,
        },
      });
    }
  });

  it("should return false if user does not have a POAP within the expected time range", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    for (var i = 0; i < poapSubgraphs.length; i++) {
      const subgraphUrl = poapSubgraphs[i];
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS)) {
          return invalidPoapResponse;
        }
      });

      const poap = new POAPProvider();
      const verifiedPayload = await poap.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);

      // Check that all the subgraph URLs have been queried
      expect(mockedAxios.post.mock.calls.length).toEqual(poapSubgraphs.length);
      for (let j = 0; j < poapSubgraphs.length; j++) {
        expect(mockedAxios.post.mock.calls[i][0]).toEqual(poapSubgraphs[i]);
      }

      expect(verifiedPayload).toEqual({
        valid: false,
        record: {},
      });
    }
  });

  it("should return false if user does not have any POAP", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    for (var i = 0; i < poapSubgraphs.length; i++) {
      const subgraphUrl = poapSubgraphs[i];
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS_LOWER)) {
          return emptyPoapResponse;
        }
      });

      const poap = new POAPProvider();
      const verifiedPayload = await poap.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);

      // Check that all the subgraph URLs have been queried
      expect(mockedAxios.post.mock.calls.length).toEqual(poapSubgraphs.length);
      for (let j = 0; j < poapSubgraphs.length; j++) {
        expect(mockedAxios.post.mock.calls[i][0]).toEqual(poapSubgraphs[i]);
      }

      expect(verifiedPayload).toEqual({
        valid: false,
        record: {},
      });
    }
  });
});
