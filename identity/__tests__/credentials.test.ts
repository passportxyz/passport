// ---- Test subject
import {
  issueChallengeCredential,
  issueMerkleCredential,
  verifyCredential,
  fetchChallengeCredential as FetchChallengeCredential,
  fetchVerifiableCredential as FetchVerifiableCredential,
} from "../src/credentials";

// ---- Types
import { Axios } from "axios";
import { DIDKitLib, VerifiableCredential } from "@dpopp/types";


// ---- Set up test state (we reset these between runs to encapsulate the jest state)
let axios: Axios;
let DIDKit: DIDKitLib;
let fetchChallengeCredential: typeof FetchChallengeCredential;
let fetchVerifiableCredential: typeof FetchVerifiableCredential;

// this would need to be a valid key but we've mocked out didkit (and no verifications are made)
const key = "SAMPLE_KEY";

describe("Fetch Credentials", function () {
  beforeEach(() => {
    return import("axios").then((module) => {
      // reset axios
      axios = module as unknown as Axios;

      return import("../src/credentials").then((module) => {
        // reset fetchChallengeCredential & fetchVerifiableCredential
        fetchChallengeCredential = module.fetchChallengeCredential;
        fetchVerifiableCredential = module.fetchVerifiableCredential;

        // reset jest counters
        jest.resetModules();
      });
    });
  });

  it("can fetch a challenge credential", async () => {
    // the returned values are fetched from the mocked axios.post(...)
    await fetchChallengeCredential("", {
      address: "0x0",
      type: "Simple",
      version: "Test-Case-1",
    });

    // check that called the axios.post fn
    expect(axios.post).toHaveBeenCalled();
  });
  
  it("can fetch a verifiable credential", async () => {
    // mock the message signer
    const signMessage = jest.fn().mockImplementation(() => Promise.resolve("Signed Message"));

    // the returned values are fetched from the mocked axios.post(...)
    await fetchVerifiableCredential(
      "",
      {
        address: "0x0",
        type: "Simple",
        version: "Test-Case-1",
      },
      {
        signMessage,
      }
    );

    // called to fetch the challenge and to verify
    expect(axios.post).toHaveBeenCalledTimes(2);
    // we expect to get back the mocked response
    expect(signMessage).toHaveBeenCalled();
  });

  it("will fail if not provided a signer to sign the message", async () => {
    // without a signer we are unable to sign the message and the signature will be passed as an empty string
    await expect(
      fetchVerifiableCredential(
        "",
        {
          address: "0x0",
          type: "Simple",
          version: "Test-Case-1",
        },
        undefined
      )
    ).rejects.toThrow("Unable to sign message");
  });

  it("will throw if signer rejects request for signature", async () => {
    // if the user rejects the signing then the signer will throw an error...
    await expect(
      fetchVerifiableCredential(
        "",
        {
          address: "0x0",
          type: "Simple",
          version: "Test-Case-1",
        },
        {
          signMessage: async () => {
            throw new Error("Unable to sign");
          },
        }
      )
    ).rejects.toThrow("Unable to sign");
  });

  it("will not attempt to sign if not provided a challenge in the challenge credential", async () => {
    // mock the message signer
    const signMessage = jest.fn().mockImplementation(() => Promise.resolve("Signed Message"));

    // NOTE: The mocked axios "/vTest-Case-2/challenge" endpoint doesn't return a challenge
    await expect(
      fetchVerifiableCredential(
        "",
        {
          address: "0x0",
          type: "Simple",
          version: "Test-Case-2",
        },
        {
          signMessage,
        }
      )
    ).rejects.toThrow("Unable to sign message");

    // NOTE: the signMessage function was never called
    expect(signMessage).not.toBeCalled();
  });
});

describe("Generate Credentials", function () {
  beforeEach(() => {
    return import("../__mocks__/didkit.js").then((module) => {
      DIDKit = module as unknown as DIDKitLib;
      jest.resetModules();
    });
  });

  it("can generate a challenge credential", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "Test-Case-1",
      challenge: "randomChallengeString",
    };

    // details of this credential are created by issueChallengeCredential - but the proof is added by DIDKit (which is mocked)
    const { credential } = await issueChallengeCredential(DIDKit, key, record);

    // expect to have called issueCredential
    expect(DIDKit.issueCredential).toHaveBeenCalled();
    // expect the structure/details added by issueMerkleCredential to be correct
    expect(credential.credentialSubject.id).toEqual(`did:ethr:${record.address}#challenge-${record.type}`);
    expect(credential.credentialSubject.challenge).toEqual(record.challenge);
    expect(credential.credentialSubject.address).toEqual(record.address);
    expect(typeof credential.proof).toEqual("object");
  });

  it("can generate a merkle credential", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "Test-Case-1",
    };

    // details of this credential are created by issueMerkleCredential - but the proof is added by DIDKit (which is mocked)
    const { credential } = await issueMerkleCredential(DIDKit, key, record);

    // expect to have called issueCredential
    expect(DIDKit.issueCredential).toHaveBeenCalled();
    // expect the structure/details added by issueMerkleCredential to be correct
    expect(credential.credentialSubject.id).toEqual(`did:ethr:${record.address}#${record.type}`);
    expect(typeof credential.credentialSubject.root === "string").toEqual(true);
    expect(typeof credential.proof).toEqual("object");
  });
});

describe("Verify Credentials", function () {
  beforeEach(() => {
    return import("../__mocks__/didkit.js").then((module) => {
      DIDKit = module as unknown as DIDKitLib;
      jest.resetModules();
    });
  });

  it("can verify a credential", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "Test-Case-1",
    };

    // we are creating this VC so that we know that we have a valid VC in this context to test against (never expired)
    const { credential } = await issueMerkleCredential(DIDKit, key, record);

    // all verifications will pass as the DIDKit response is mocked
    expect(await verifyCredential(DIDKit, credential)).toEqual(true);
    // expect to have called verifyCredential
    expect(DIDKit.verifyCredential).toHaveBeenCalled();
  });

  it("cannot verify a valid but expired credential", async () => {
    // create a date and move it into the past
    const expired = new Date();
    expired.setSeconds(expired.getSeconds() - 1);

    // if the expiration date is in the past then this VC has expired
    const credential = {
      expirationDate: expired.toISOString(),
    } as unknown as VerifiableCredential;

    // before the credential is verified against DIDKit - we check its expiration date...
    expect(await verifyCredential(DIDKit, credential)).toEqual(false);
    // expect to have not called verify on didkit
    expect(DIDKit.verifyCredential).not.toBeCalled();
  });
});
