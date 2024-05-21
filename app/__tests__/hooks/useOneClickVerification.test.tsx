import { render, waitFor, screen } from "@testing-library/react";
import { useOneClickVerification } from "../../hooks/useOneClickVerification";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { mutableUserVerificationAtom, userVerificationAtom } from "../../context/userState";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContext, CeramicContextState } from "../../context/ceramicContext";
import { DID } from "dids";
import { DatastoreConnectionContext } from "../../context/datastoreConnectionContext";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { fetchPossibleEVMStamps } from "../../signer/utils";
import { VerifiableCredential } from "@gitcoin/passport-types";

jest.mock("../../context/walletStore", () => ({
  useWalletStore: () => "validAddress",
}));
jest.mock("../../utils/helpers", () => ({
  createSignedPayload: jest.fn(),
}));

jest.mock("@gitcoin/passport-identity", () => ({
  fetchVerifiableCredential: jest.fn(),
}));

const mockPossiblePlatforms = [
  {
    platformProps: {
      platform: {
        platformId: "Ens",
        path: "Ens",
        clientId: null,
        redirectUri: null,
        banner: {
          heading:
            "The ENS stamp only recognizes ENS domains if they are set to your account as primary ENS (or reverse record).",
        },
        isEVM: true,
      },
      platFormGroupSpec: [
        {
          platformGroup: "Account Name",
          providers: [
            {
              title: "Encrypted",
              name: "Ens",
              hash: "0xb4448bd57db012361e41665a60f3906dda48b4ffc1e4b8151cb2b6d431861fae",
            },
          ],
        },
      ],
    },
  },
  {
    groups: [
      {
        name: "NFT Ownership Verification",
        providers: [
          {
            name: "NFT",
            title: "Holds at least 1 NFT (ERC-721)",
          },
        ],
      },
    ],
    platformProps: {
      platform: {
        platformId: "NFT",
        path: "NFT",
        banner: {
          content:
            "Click verify to process your Ethereum Mainnet NFTs. Passport uses a constantly evolving model to review your NFT activity and compare against known Sybil behavior. The number of points you'll receive is based on many factors related to the overall NFT portfolio of the address.",
          cta: {
            label: "Learn more",
            url: "https://support.passport.xyz/passport-knowledge-base/how-do-i-add-passport-stamps/nft-stamp",
          },
        },
        isEVM: true,
      },
      platFormGroupSpec: [
        {
          platformGroup: "Collector's Journey",
          providers: [
            {
              name: "NFTScore#50",
              title: "Digital Collector",
              description: "Recognizes users beginning to explore the NFT space with a budding collection.",
              hash: "0xa82f2576f6aeb63eec71b5532a92ba80304d7297964d2f9e51687585bf04ecb9",
            },
            {
              name: "NFTScore#75",
              title: "Art Aficionado",
              description:
                "Highlights users with a significant, more curated NFT portfolio that demonstrates their deeper involvement and appreciation for digital art and assets.",
              hash: "0x2214300cd20ba76c4708f826eb419f593e2f1ea0f92fb8395287d01ae87aff93",
            },
            {
              name: "NFTScore#90",
              title: "NFT Visionary",
              description:
                "Distinguishes users at the forefront of the NFT movement, showcasing exceptional collections that set trends within the community.",
              hash: "0x02bb707ad8f8f1c5137c340efea0057614ebadb3634679e1dc12110eae413131",
            },
          ],
        },
        {
          platformGroup: "NFT Ownership Verification",
          providers: [
            {
              name: "NFT",
              title: "Holds at least 1 NFT (ERC-721)",
              description:
                "Verifies users possessing at least one ERC-721 NFT on the Ethereum mainnet, serving as the foundational credential within the NFT stamp category.",
              hash: "0x9c4138cd0a1311e4748f70d0fe3dc55f0f5f75e0f20db731225cbc3b8914016a",
            },
          ],
        },
      ],
    },
  },
  {
    groups: [
      {
        name: "Lens Handle",
        providers: [
          {
            name: "Lens",
            title: "At least 1 Lens Handle",
          },
        ],
      },
    ],
    platformProps: {
      platform: {
        platformId: "Lens",
        path: "Lens",
        clientId: null,
        redirectUri: null,
        banner: {
          content:
            "To add the Lens Stamp to your Gitcoin Passport, ensure you're using\n    your Lens Handle, not your profile. A Lens Handle is your unique identifier on\n    Lens, required for verification. Obtain a Handle either through the Lens beta or\n    by purchasing one from NFT marketplaces. Note: Verification may be delayed after\n    claiming your Handle.",
          cta: {
            label: "Learn more",
            url: "https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/how-do-i-add-passport-stamps/guide-to-add-lens-stamp-to-gitcoin-passport",
          },
        },
        isEVM: true,
      },
      platFormGroupSpec: [
        {
          platformGroup: "Lens Handle",
          providers: [
            {
              title: "At least 1 Lens Handle",
              name: "Lens",
              hash: "0xc419da342463a3de054e208341b27aaef55e74a1660a45ac10cf1dae4d4964d2",
            },
          ],
        },
      ],
    },
  },
  {
    groups: [
      {
        name: "Guild Passport Member",
        providers: [
          {
            name: "GuildPassportMember",
            title: "Member with 1 or more roles in Gitcoin Passport Guild",
          },
        ],
      },
    ],
    platformProps: {
      platform: {
        platformId: "GuildXYZ",
        path: "GuildXYZ",
        isEVM: true,
        clientId: null,
        redirectUri: null,
        banner: {
          heading: "*Qualifying guilds have more than 250 members",
        },
      },
      platFormGroupSpec: [
        {
          platformGroup: "Guild Admin",
          providers: [
            {
              title: "Owner or Administrator of one or more guilds*",
              name: "GuildAdmin",
              hash: "0xc9c133c0562b97cb13073c80d829afe63678e804b083f7dc5168b454ada25bc1",
            },
          ],
        },
        {
          platformGroup: "Guild Passport Member",
          providers: [
            {
              title: "Member with 1 or more roles in Gitcoin Passport Guild",
              name: "GuildPassportMember",
              hash: "0x9e6e85c3cc8c738ffb999a6e15ddeee80344c28966348d16025c44fb064c6025",
            },
          ],
        },
      ],
    },
  },
];

jest.mock("../../signer/utils", () => ({
  fetchPossibleEVMStamps: jest.fn(),
}));

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

const TestingComponent = () => {
  const [verificationState, _setUserVerificationState] = useAtom(mutableUserVerificationAtom);
  const { initiateVerification } = useOneClickVerification();

  useEffect(() => {
    // initiateVerification();
  }, [verificationState]);

  return (
    <DatastoreConnectionContext.Provider
      value={{
        dbAccessToken: "token",
        dbAccessTokenStatus: "idle",
        did: {
          id: "did:3:abc",
          parent: "did:3:abc",
        } as unknown as DID,
        connect: async () => {},
        disconnect: async () => {},
        checkSessionIsValid: () => false,
      }}
    >
      <div onClick={initiateVerification}>Click me</div>
      <div data-testid="loadingState">{verificationState.loading.toString()}</div>
      <div data-testid="success">{verificationState.success.toString()}</div>
      <div data-testid="error">{verificationState?.error?.toString()}</div>
    </DatastoreConnectionContext.Provider>
  );
};

describe("useOneClickVerification", () => {
  it("should not attempt to issue credentials if no possible stamps are found", async () => {
    renderWithContext(mockCeramicContext, <TestingComponent />);
    await waitFor(() => {
      screen.getByText("Click me").click();
      expect(fetchVerifiableCredential).not.toHaveBeenCalled();
    });
  });
  it("should attempt to issue credentials if possible stamps are found", async () => {
    renderWithContext(mockCeramicContext, <TestingComponent />);
    (fetchPossibleEVMStamps as jest.Mock).mockResolvedValue(mockPossiblePlatforms);
    await waitFor(() => {
      screen.getByText("Click me").click();
      expect(fetchVerifiableCredential).toHaveBeenCalledWith(
        "http://localhost:80/api/",
        expect.objectContaining({
          types: ["Ens", "NFT", "Lens", "GuildXYZ"],
        }),
        expect.any(Function)
      );
    });
  });
  it("should indicate passport was successfully refreshed", async () => {
    renderWithContext(mockCeramicContext, <TestingComponent />);
    (fetchPossibleEVMStamps as jest.Mock).mockResolvedValue(mockPossiblePlatforms);
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [
        {
          record: {
            type: "Lens",
            version: "0.0.0",
            handle: "lens/profile",
          },
          credential: {
            credentialSubject: {
              provider: "Lens",
            },
          } as unknown as VerifiableCredential,
        },
        {
          record: {
            type: "Ens",
            version: "0.0.0",
            ens: "ensens.eth",
          },
          credential: {
            credentialSubject: {
              provider: "Ens",
            },
          } as VerifiableCredential,
        },
        {
          record: {
            type: "NFT",
            version: "0.0.0",
            tokenAddress: "asdf",
            tokenId: "asdf",
          },
          credential: {
            credentialSubject: {
              provider: "NFT",
            },
          } as unknown as VerifiableCredential,
        },
      ],
    });
    await waitFor(() => {
      screen.getByText("Click me").click();
      expect(screen.getByTestId("success").textContent).toBe("true");
    });
  });
  it("should indicate that an error was thrown", async () => {
    renderWithContext(mockCeramicContext, <TestingComponent />);
    (fetchPossibleEVMStamps as jest.Mock).mockResolvedValue(mockPossiblePlatforms);
    (fetchVerifiableCredential as jest.Mock).mockRejectedValue(new Error("error"));
    await waitFor(() => {
      screen.getByText("Click me").click();
      expect(screen.getByTestId("error").textContent).toBe("Error: error");
    });
  });
});
