/* eslint-disable */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {API_KEY, WIWBadgeProvider} from "../wiwBadgeProvider";

// ----- Libs
import axios from "axios";
import * as assert from "assert";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const VALID_ADDRESS = "0xddCdAb922b9c3feDA58C26355f2440e7121e400F";
const VALID_ADDRESS_LOWER = VALID_ADDRESS.toLocaleLowerCase();
const INVALID_ADDRESS = "0xddCdAb922b9c3feDA58C26355f412342121e400F";
const INVALID_ADDRESS_LOWER = INVALID_ADDRESS.toLocaleLowerCase();
const NOT_ADDRESS = "24231fwq5g5";
const API_URL = "https://advanced-api.wiw.io/badges/address/";
const INVALID_API_KEY = "INVALID_API_KEY"

const VALID_API_RESPONSE = {
  status: 200,
  data: {
    address: "0xddcdab922b9c3feda58c26355f2440e7121e400f",
    query_time: "2023-03-30T09:10:02.699Z",
    badge_count: 15,
    badge_list: [
      {
        "id": "02bcac86d8cc97253a9711e3405502cec912700e48dccd58f97b817638474cd5",
        "name": "Diamond Hand",
        "description": "Diamond Hand of XenoInfinity",
        "icon_url": "https://static.wiw.io/nft-icons/xenoinfinity/91635ebbe00d5391e440d742dabd3a9e",
        "update_time": "2023-03-30T02:27:29.000Z"
      },
      {
        "id": "057c1210d0c7837f7a0c7648b6f813cc09bb808a66af5d3b391269315c7d1465",
        "name": "Diamond Hand",
        "description": "Diamond Hand of Scientists",
        "icon_url": "https://static.wiw.io/nft-icons/augminted-labs-scientists/1e68b6c4099d3995186a69eedc3c021c",
        "update_time": "2023-03-30T02:27:29.000Z"
      }
    ]
  }
}

const INVALID_API_RESPONSE = {
  status: 200,
  data: {
    address: "0xddcdab922b9c3feda58c26355f412342121e400f",
    query_time: "2023-03-30T09:10:02.699Z",
    badge_count: 14,
    badge_list: [
      {
        "id": "02bcac86d8cc97253a9711e3405502cec912700e48dccd58f97b817638474cd5",
        "name": "Diamond Hand",
        "description": "Diamond Hand of XenoInfinity",
        "icon_url": "https://static.wiw.io/nft-icons/xenoinfinity/91635ebbe00d5391e440d742dabd3a9e",
        "update_time": "2023-03-30T02:27:29.000Z"
      },
      {
        "id": "057c1210d0c7837f7a0c7648b6f813cc09bb808a66af5d3b391269315c7d1465",
        "name": "Diamond Hand",
        "description": "Diamond Hand of Scientists",
        "icon_url": "https://static.wiw.io/nft-icons/augminted-labs-scientists/1e68b6c4099d3995186a69eedc3c021c",
        "update_time": "2023-03-30T02:27:29.000Z"
      }
    ]
  }
}

const ERROR_API_RESPONSE = {
  status: 500,
  err: "some error message"
}

describe("Attempt WIW badge verification", function() {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("return valid payload if address having at least 15 badges", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      if (url === (API_URL + VALID_ADDRESS_LOWER) && config.headers.Authorization === API_KEY) {
        return VALID_API_RESPONSE;
      }
    });
    const wiwBadgeProvider = new WIWBadgeProvider();
    const verifiedPayload = await wiwBadgeProvider.verify({
      address: VALID_ADDRESS,
    } as RequestPayload);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: `${VALID_ADDRESS_LOWER}`,
        hasWIWBadgeGTEThreshold: "true",
      }});
  })

  it("return invalid payload if address having less than 15 badges", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      if (url === (API_URL + INVALID_ADDRESS_LOWER) && config.headers.Authorization === API_KEY) {
        return INVALID_API_RESPONSE;
      }
    });
    const wiwBadgeProvider = new WIWBadgeProvider();
    const verifiedPayload = await wiwBadgeProvider.verify({
      address: INVALID_ADDRESS,
    } as RequestPayload);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toEqual({valid: false});
  })


  it("return invalid payload if API returns error message", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return ERROR_API_RESPONSE;
    });
    const wiwBadgeProvider = new WIWBadgeProvider();
    const verifiedPayload = await wiwBadgeProvider.verify({
      address: VALID_ADDRESS,
    } as RequestPayload);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toEqual({valid: false});
  })

})