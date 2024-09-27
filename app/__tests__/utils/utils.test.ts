import { fetchPossibleEVMStamps, getTypesToCheck } from "../../signer/utils";
import { providers } from "@gitcoin/passport-platforms";
import {
  CheckRequestBody,
  CheckResponseBody,
  Passport,
  ProviderContext,
  RequestPayload,
  VerifiedPayload,
  OnChainVerifiableEip712Credential,
  VerifiableEip712Credential,
} from "@gitcoin/passport-types";
import { platforms } from "@gitcoin/passport-platforms";
const { Ens, Lens, Github } = platforms;
import axios from "axios";
import { _checkShowOnboard } from "../../utils/helpers";
import { PlatformProps } from "../../components/GenericPlatform";
import { formatEIP712CompatibleCredential, getCredentialSplitSignature } from "../../utils/vcs";

const mockedAllPlatforms = new Map();
mockedAllPlatforms.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.ProviderConfig,
});

const testCredentialconst: VerifiableEip712Credential = {
  type: ["VerifiableCredential"],
  proof: {
    type: "EthereumEip712Signature2021",
    created: "2024-09-27T17:14:37.290Z",
    "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
    proofValue:
      "0x8994712895556c7916b52ede01f9a1f0b71d73e3dc6cd1318be1a56361a7791258352eac95e2507281cdf26ec891690952848b63006c2adeda30c217765f72a91b",
    eip712Domain: {
      types: {
        Proof: [
          {
            name: "@context",
            type: "string",
          },
          {
            name: "created",
            type: "string",
          },
          {
            name: "proofPurpose",
            type: "string",
          },
          {
            name: "type",
            type: "string",
          },
          {
            name: "verificationMethod",
            type: "string",
          },
        ],
        "@context": [
          {
            name: "hash",
            type: "string",
          },
          {
            name: "provider",
            type: "string",
          },
        ],
        Document: [
          {
            name: "@context",
            type: "string[]",
          },
          {
            name: "credentialSubject",
            type: "CredentialSubject",
          },
          {
            name: "expirationDate",
            type: "string",
          },
          {
            name: "issuanceDate",
            type: "string",
          },
          {
            name: "issuer",
            type: "string",
          },
          {
            name: "proof",
            type: "Proof",
          },
          {
            name: "type",
            type: "string[]",
          },
        ],
        EIP712Domain: [
          {
            name: "name",
            type: "string",
          },
        ],
        CredentialSubject: [
          {
            name: "@context",
            type: "@context",
          },
          {
            name: "hash",
            type: "string",
          },
          {
            name: "id",
            type: "string",
          },
          {
            name: "provider",
            type: "string",
          },
        ],
      },
      domain: {
        name: "VerifiableCredential",
      },
      primaryType: "Document",
    },
    proofPurpose: "assertionMethod",
    verificationMethod: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb#controller",
  },
  issuer: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb",
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
  issuanceDate: "2024-09-27T17:14:37.283Z",
  expirationDate: "2024-12-26T17:14:37.283Z",
  credentialSubject: {
    id: "did:pkh:eip155:1:0x0636F974D29d947d4946b2091d769ec6D2d415DE",
    hash: "v0.0.0:DuIuMoRGzEw9Is5C/uGkKxqzQBR+0BuUtMPsrFEkstc=",
    "@context": {
      hash: "https://schema.org/Text",
      provider: "https://schema.org/Text",
    },
    provider: "ETHGasSpent#0.25",
  },
};

describe("formatEIP712CompatibleCredential", () => {
  it("should correctly format a basic VerifiableEip712Credential", () => {
    const result = formatEIP712CompatibleCredential(testCredentialconst);

    expect(result).toEqual({
      _context: ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
      _type: ["VerifiableCredential"],
      credentialSubject: {
        _context: {
          _hash: "https://schema.org/Text",
          provider: "https://schema.org/Text",
        },
        _hash: "v0.0.0:DuIuMoRGzEw9Is5C/uGkKxqzQBR+0BuUtMPsrFEkstc=",
        id: "did:pkh:eip155:1:0x0636F974D29d947d4946b2091d769ec6D2d415DE",
        provider: "ETHGasSpent#0.25",
      },
      expirationDate: "2024-12-26T17:14:37.283Z",
      issuanceDate: "2024-09-27T17:14:37.283Z",
      issuer: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb",
      proof: {
        _context: "https://w3id.org/security/suites/eip712sig-2021/v1",
        _type: "EthereumEip712Signature2021",
        created: "2024-09-27T17:14:37.290Z",
        eip712Domain: {
          domain: {
            name: "VerifiableCredential",
          },
          primaryType: "Document",
          types: {
            "@context": [
              {
                name: "hash",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            CredentialSubject: [
              {
                name: "@context",
                type: "@context",
              },
              {
                name: "hash",
                type: "string",
              },
              {
                name: "id",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            Document: [
              {
                name: "@context",
                type: "string[]",
              },
              {
                name: "credentialSubject",
                type: "CredentialSubject",
              },
              {
                name: "expirationDate",
                type: "string",
              },
              {
                name: "issuanceDate",
                type: "string",
              },
              {
                name: "issuer",
                type: "string",
              },
              {
                name: "proof",
                type: "Proof",
              },
              {
                name: "type",
                type: "string[]",
              },
            ],
            EIP712Domain: [
              {
                name: "name",
                type: "string",
              },
            ],
            Proof: [
              {
                name: "@context",
                type: "string",
              },
              {
                name: "created",
                type: "string",
              },
              {
                name: "proofPurpose",
                type: "string",
              },
              {
                name: "type",
                type: "string",
              },
              {
                name: "verificationMethod",
                type: "string",
              },
            ],
          },
        },
        proofPurpose: "assertionMethod",
        proofValue:
          "0x8994712895556c7916b52ede01f9a1f0b71d73e3dc6cd1318be1a56361a7791258352eac95e2507281cdf26ec891690952848b63006c2adeda30c217765f72a91b",
        verificationMethod: "did:ethr:0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb#controller",
      },
    });
  });
  it("should return a split signature", () => {
    const { v, r, s } = getCredentialSplitSignature(testCredentialconst);
    console.log({ v, r, s });
  });
});

mockedAllPlatforms.set("Lens", {
  platform: new Lens.LensPlatform(),
  platFormGroupSpec: Lens.ProviderConfig,
});

mockedAllPlatforms.set("Github", {
  platform: new Github.GithubPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Github.ProviderConfig,
});

describe("fetchPossibleEVMStamps", () => {
  beforeEach(() => {
    jest.spyOn(axios, "post").mockImplementation(async (url, payload): Promise<{ data: CheckResponseBody[] }> => {
      return {
        data: [
          {
            type: "Ens",
            valid: true,
          },
          {
            type: "Lens",
            valid: false,
          },
          {
            type: "Github",
            valid: true,
          },
        ],
      };
    });
  });

  it("should return valid evm platforms", async () => {
    const result = await fetchPossibleEVMStamps("0x123", mockedAllPlatforms, undefined);

    expect(result.length).toBe(1);

    expect(result[0].platformProps.platform.path).toBe("Ens");
  });
  it("should return existing stamps to check", async () => {
    const passport = {
      stamps: [
        {
          provider: "Ens",
        },
      ],
    } as Passport;
    const allPlatformsData = Array.from(mockedAllPlatforms.values());
    const evmPlatforms: PlatformProps[] = allPlatformsData.filter(({ platform }) => platform.isEVM);
    const types = getTypesToCheck(evmPlatforms, passport, true);

    expect(types.length).toBe(2);
    expect(types).toEqual(["Ens", "Lens"]);
  });
});

describe("checkShowOnboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns true if onboardTS is not set in localStorage", async () => {
    expect(_checkShowOnboard("")).toBe(true);
  });

  it("returns true if onboardTS is set and older than 3 months", async () => {
    const olderTimestamp = Math.floor(Date.now() / 1000) - 3 * 30 * 24 * 60 * 60 - 1;
    localStorage.setItem("onboardTS", olderTimestamp.toString());
    expect(_checkShowOnboard("")).toBe(true);
  });

  it("returns false if onboardTS is set and within the last 3 months", async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("")).toBe(false);
  });

  it("returns true if onboardTS is set and exactly 3 months old", async () => {
    const threeMonthsOldTimestamp = Math.floor(Date.now() / 1000) - 3 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", threeMonthsOldTimestamp.toString());
    expect(_checkShowOnboard("")).toBe(true);
  });

  it("returns true if ONBOARD_RESET_INDEX newly set", async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("1")).toBe(true);
  });

  it("returns false if ONBOARD_RESET_INDEX set but already processed and re-skipped", async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("1")).toBe(true);
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("1")).toBe(false);
  });

  it("returns true if ONBOARD_RESET_INDEX set, re-skipped, then changed again", async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("1")).toBe(true);
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("2")).toBe(true);
  });
});
