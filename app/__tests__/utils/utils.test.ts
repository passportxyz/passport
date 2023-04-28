import { fetchPossibleEVMStamps } from "../../signer/utils";
import { providers } from "@gitcoin/passport-platforms";
import {
  CheckRequestBody,
  CheckResponseBody,
  ProviderContext,
  RequestPayload,
  VerifiedPayload,
} from "@gitcoin/passport-types";
import { VALID_ENS_VERIFICATION, VALID_LENS_VERIFICATION } from "../../__test-fixtures__/verifiableCredentialResults";
import { Ens, Lens, Github } from "@gitcoin/passport-platforms";

import axios from "axios";

const mockedAllPlatforms = new Map();
mockedAllPlatforms.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.EnsProviderConfig,
});

mockedAllPlatforms.set("Lens", {
  platform: new Lens.LensPlatform(),
  platFormGroupSpec: Lens.LensProviderConfig,
});

mockedAllPlatforms.set("Github", {
  platform: new Github.GithubPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Github.GithubProviderConfig,
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
});
