/* eslint-disable */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { OutdidProvider } from "../Providers/outdid";
import { outdidRequestVerification } from "../procedures/outdidVerification";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const userDid = "mock user DID";
const userID = "mock unique user ID";
const verificationID = "11112222";
const redirect = process.env.NEXT_PUBLIC_PASSPORT_OUTDID_CALLBACK;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Attempt Outdid verification", function () {
  async function mockProvider(mockedRequest: object) {
    mockedAxios.get.mockImplementation(async (url, config) => {
        return mockedRequest;
    });

    const outdid = new OutdidProvider();
    const outdidPayload = await outdid.verify({
        proofs: {
            verificationID,
            userDid,
        },
    } as unknown as RequestPayload);

    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
        `https://api.outdid.io/v1/verification-request?verificationID=${verificationID}`,
    );

    return outdidPayload;
  }

  it("handles valid verification attempt", async () => {
    const outdidPayload = await mockProvider({
        data: {
            verificationName: userDid,
            uniqueID: userID,
            parameters: { uniqueness: true },
            status: "succeeded",
        },
        status: 200
    });
    expect(outdidPayload).toEqual({
        valid: true,
        errors: [],
        record: {
            id: userID,
        },
    });
  });

  it("handles expired verification attempt", async () => {
    const outdidPayload = await mockProvider({
        data: {
            verificationName: userDid,
            uniqueID: userID,
            parameters: { uniqueness: true },
            status: "expired",
        },
        status: 200
    });
    expect(outdidPayload).toEqual({
        valid: false,
        errors: [],
        record: {
            id: userID,
        },
    });
  });           

  it("handles unexpected response from Outdid", async () => {
    const outdidPayload = await mockProvider({
        status: 500
    });

    expect(outdidPayload).toMatchObject({ valid: false });
  });

  it("result should not be valid in case user DID is not returned from Outdid", async () => {
    const outdidPayload = await mockProvider({
        data: {
            verificationName: undefined,
            uniqueID: userID,
            parameters: { uniqueness: true },
            status: "succeeded",
        },
        status: 200
    });
    expect(outdidPayload).toMatchObject({ valid: false });
  });


  it("result should not be valid in case no parameters are returned from Outdid", async () => {
    const outdidPayload = await mockProvider({
        data: {
            verificationName: userDid,
            parameters: undefined,
            status: "failed",
        },
        status: 200
    });
    expect(outdidPayload).toMatchObject({ valid: false });
  });

  it("result should not be valid in case no user identifier is returned from Outdid", async () => {
    const outdidPayload = await mockProvider({
        data: {
            verificationName: userDid,
            uniqueID: undefined,
            parameters: { uniqueness: true },
            status: "succeeded",
        },
        status: 200
    });
    expect(outdidPayload).toMatchObject({ valid: false });
  });
});


describe("Attempt Outdid request verification", function () {
    it("handles valid verification", async () => {
        const successRedirect = "http://example.com";
        mockedAxios.post.mockImplementation(async (url, _, config) => {
            return {
                data: {
                    successRedirect,
                    verificationID,
                },
                status: 200,
            };
        });
        const verificationRequestData = await outdidRequestVerification(userDid, redirect);

        expect(mockedAxios.post).toBeCalledTimes(1);
        expect(mockedAxios.post).toBeCalledWith(
            `https://api.outdid.io/v1/verification-request?apiKey=${process.env.OUTDID_API_KEY}&apiSecret=${process.env.OUTDID_API_SECRET}`,
            expect.objectContaining({
                verificationParameters: { uniqueness: true },
                verificationType: "icao",
                verificationName: userDid,
                redirect,
            }),
        );

        expect(verificationRequestData).toEqual({ 
            successRedirect,
            verificationID
         });
      });
});