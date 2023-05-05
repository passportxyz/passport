/* eslint-disable */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { PHIActivitySilverProvider, PHIActivityGoldProvider } from "../Providers";
import { phiSubgraphs } from "../Providers/phiActivity";

// ----- Libs
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0x685c99E8780e5a7f158617cC2E9acc0e45a66120";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();
const MOCK_ADDRESS2 = "0xe35E5f8B912C25cDb6B00B347cb856467e4112A3";
const MOCK_ADDRESS2_LOWER = MOCK_ADDRESS2.toLocaleLowerCase();

const validPhiQuestSilverResponse = {
  data: {
    data: {
      logClaimObjects: [
        {
          tokenid: "100165",
          blockNumber: "37981110",
        },
        {
          tokenid: "100161",
          blockNumber: "37981067",
        },
        {
          tokenid: "100162",
          blockNumber: "37981077",
        },
        {
          tokenid: "100163",
          blockNumber: "37981092",
        },
        {
          tokenid: "100164",
          blockNumber: "37981100",
        },
      ],
    },
  },
};

const validPhiQuestGoldResponse = {
  data: {
    data: {
      logClaimObjects: [
        {
          tokenid: "100168",
          blockNumber: "39256357",
        },
        {
          tokenid: "100170",
          blockNumber: "41352480",
        },
        {
          tokenid: "100167",
          blockNumber: "38549298",
        },
        {
          tokenid: "100166",
          blockNumber: "37981133",
        },
        {
          tokenid: "100169",
          blockNumber: "39440264",
        },
      ],
    },
  },
};

const invalidPhiquestResponse = {
  data: {
    data: {
      logClaimObjects: [
        {
          tokenid: "100002",
          blockNumber: "36459670",
        },
      ],
    },
  },
};

const emptyPhiQuestResponse = {
  data: {
    data: {
      logClaimObjects: [{}],
    },
  },
};
interface RequestData {
  query: string;
}

describe("Attempt Silver verification", function () {
  it("handles valid verification attempt", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    const expectedSubgraphsToCheck: string[] = [];
    for (let i = 0; i < phiSubgraphs.length; i++) {
      const subgraphUrl: string = phiSubgraphs[i];
      expectedSubgraphsToCheck.push(subgraphUrl);
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS_LOWER)) {
          return validPhiQuestSilverResponse;
        }
      });

      const phi = new PHIActivitySilverProvider();
      const verifiedPayload = await phi.verify({
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

  it("should return false if user does not have a PHI within the expected time range", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    for (let i = 0; i < phiSubgraphs.length; i++) {
      const subgraphUrl = phiSubgraphs[i];
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS)) {
          return invalidPhiquestResponse;
        }
      });

      const phi = new PHIActivitySilverProvider();
      const verifiedPayload = await phi.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);

      // Check that all the subgraph URLs have been queried
      expect(mockedAxios.post.mock.calls.length).toEqual(phiSubgraphs.length);
      for (let j = 0; j < phiSubgraphs.length; j++) {
        expect(mockedAxios.post.mock.calls[i][0]).toEqual(phiSubgraphs[i]);
      }

      expect(verifiedPayload).toEqual({
        valid: false,
        record: {},
      });
    }
  });

  it("should return false if user does not have any PHI Siliver Object", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    for (let i = 0; i < phiSubgraphs.length; i++) {
      const subgraphUrl = phiSubgraphs[i];
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS2_LOWER)) {
          return emptyPhiQuestResponse;
        }
      });

      const phi = new PHIActivitySilverProvider();
      const verifiedPayload = await phi.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);

      // Check that all the subgraph URLs have been queried
      expect(mockedAxios.post.mock.calls.length).toEqual(phiSubgraphs.length);
      for (let j = 0; j < phiSubgraphs.length; j++) {
        expect(mockedAxios.post.mock.calls[i][0]).toEqual(phiSubgraphs[i]);
      }

      expect(verifiedPayload).toEqual({
        valid: false,
        record: {},
      });
    }
  });
});

describe("Attempt Gold verification", function () {
  it("handles valid verification attempt", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    const expectedSubgraphsToCheck: string[] = [];
    for (let i = 0; i < phiSubgraphs.length; i++) {
      const subgraphUrl: string = phiSubgraphs[i];
      expectedSubgraphsToCheck.push(subgraphUrl);
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS_LOWER)) {
          return validPhiQuestGoldResponse;
        }
      });

      const phi = new PHIActivityGoldProvider();
      const verifiedPayload = await phi.verify({
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

  it("should return false if user does not have a PHI within the expected time range", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    for (let i = 0; i < phiSubgraphs.length; i++) {
      const subgraphUrl = phiSubgraphs[i];
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS)) {
          return invalidPhiquestResponse;
        }
      });

      const phi = new PHIActivityGoldProvider();
      const verifiedPayload = await phi.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);

      // Check that all the subgraph URLs have been queried
      expect(mockedAxios.post.mock.calls.length).toEqual(phiSubgraphs.length);
      for (let j = 0; j < phiSubgraphs.length; j++) {
        expect(mockedAxios.post.mock.calls[i][0]).toEqual(phiSubgraphs[i]);
      }

      expect(verifiedPayload).toEqual({
        valid: false,
        record: {},
      });
    }
  });

  it("should return false if user does not have any PHI Gold Object", async () => {
    // We'll mock responses on each of the configured networks, and check the expected calls
    for (let i = 0; i < phiSubgraphs.length; i++) {
      const subgraphUrl = phiSubgraphs[i];
      jest.clearAllMocks();

      mockedAxios.post.mockImplementation(async (url, data) => {
        const query: string = (data as RequestData).query;
        if (url === subgraphUrl && query.includes(MOCK_ADDRESS2_LOWER)) {
          return emptyPhiQuestResponse;
        }
      });

      const phi = new PHIActivitySilverProvider();
      const verifiedPayload = await phi.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);

      // Check that all the subgraph URLs have been queried
      expect(mockedAxios.post.mock.calls.length).toEqual(phiSubgraphs.length);
      for (let j = 0; j < phiSubgraphs.length; j++) {
        expect(mockedAxios.post.mock.calls[i][0]).toEqual(phiSubgraphs[i]);
      }

      expect(verifiedPayload).toEqual({
        valid: false,
        record: {},
      });
    }
  });
});
