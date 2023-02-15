/* eslint-disable testing-library/no-wait-for-multiple-assertions */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdditionalStampModal } from "../../components/AdditionalStampModal";
import { fetchPossibleEVMStamps } from "../../signer/utils";
import { VALID_ENS_VERIFICATION, VALID_LENS_VERIFICATION } from "../../__test-fixtures__/verifiableCredentialResults";
import { VerifiableCredential } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

jest.mock("../../utils/onboard.ts");

jest.mock("../../signer/utils", () => ({
  fetchPossibleEVMStamps: jest.fn(),
}));

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

const mockPossibleEVMStamps = [
  {
    validatedPlatformGroups: [
      [
        {
          payload: {
            valid: true,
            record: {
              address: "0x509c34f1d27f240c3cda3711232583d4ba4d7146",
              hasVotedOnGTE2SnapshotProposals: "true",
            },
          },
          providerType: "SnapshotVotesProvider",
        },
      ],
      [
        {
          payload: {
            valid: false,
          },
          providerType: "SnapshotProposalsProvider",
        },
      ],
    ],
    platformProps: {
      platform: {
        platformId: "Snapshot",
        path: "Snapshot",
        isEVM: true,
      },
      platFormGroupSpec: [
        {
          platformGroup: "Snapshot Voter",
          providers: [
            {
              title: "Voted on 2 or more DAO proposals",
              name: "SnapshotVotesProvider",
            },
          ],
        },
        {
          platformGroup: "Snapshot Proposal Creator",
          providers: [
            {
              title: "Created a DAO proposal that was voted on by at least 1 account",
              name: "SnapshotProposalsProvider",
            },
          ],
        },
      ],
    },
  },
  {
    validatedPlatformGroups: [
      [
        {
          payload: {
            valid: true,
            record: {
              address: "0x509c34f1d27f240c3cda3711232583d4ba4d7146",
              ethPossessionsGte: "1",
            },
          },
          providerType: "ethPossessionsGte#1",
        },
        {
          payload: {
            valid: false,
            record: {},
          },
          providerType: "ethPossessionsGte#10",
        },
        {
          payload: {
            valid: false,
            record: {},
          },
          providerType: "ethPossessionsGte#32",
        },
      ],
      [
        {
          payload: {
            valid: true,
            record: {
              address: "0x509c34f1d27f240c3cda3711232583d4ba4d7146",
              hasGTE30DaysSinceFirstTxnOnTheMainnet: "true",
            },
          },
          providerType: "FirstEthTxnProvider",
        },
        {
          payload: {
            valid: false,
          },
          providerType: "EthGTEOneTxnProvider",
        },
      ],
      [
        {
          payload: {
            valid: false,
          },
          providerType: "EthGasProvider",
        },
      ],
    ],
    platformProps: {
      platform: {
        platformId: "ETH",
        path: "ETH",
        clientId: null,
        redirectUri: null,
        isEVM: true,
      },
      platFormGroupSpec: [
        {
          platformGroup: "Possessions",
          providers: [
            {
              title: "At least 1 ETH",
              name: "ethPossessionsGte#1",
            },
            {
              title: "At least 10 ETH",
              name: "ethPossessionsGte#10",
            },
            {
              title: "At least 32 ETH",
              name: "ethPossessionsGte#32",
            },
          ],
        },
        {
          platformGroup: "Transactions",
          providers: [
            {
              title: "First ETH transaction occurred more than 30 days ago",
              name: "FirstEthTxnProvider",
            },
            {
              title: "At least 1 ETH transaction",
              name: "EthGTEOneTxnProvider",
            },
          ],
        },
        {
          platformGroup: "Gas fees spent",
          providers: [
            {
              title: "At least 0.5 ETH in gas fees spent",
              name: "EthGasProvider",
            },
          ],
        },
      ],
    },
  },
];

describe.only("AdditionalStampModal", () => {
  beforeEach(() => {
    (fetchPossibleEVMStamps as jest.Mock).mockResolvedValue(mockPossibleEVMStamps);
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [],
    });
  });

  it("renders a list of possible platforms", async () => {
    render(
      <AdditionalStampModal
        onClose={() => {}}
        additionalSigner={{ addr: "0xasdf", sig: "", msg: "", challenge: {} as VerifiableCredential }}
      />
    );
    await waitFor(async () => {
      expect(screen.getByText("Stamp Verification")).toBeInTheDocument();
      expect(screen.getByText("0xasdf")).toBeInTheDocument();
      mockPossibleEVMStamps.forEach((stamp) => {
        const platoformGroupName = stamp.platformProps.platform.path;
        expect(screen.getByText(platoformGroupName)).toBeInTheDocument();
      });
    });
  });

  it("should show stamp selection inputs when requested", async () => {
    render(
      <AdditionalStampModal
        onClose={() => {}}
        additionalSigner={{ addr: "0xasdf", sig: "", msg: "", challenge: {} as VerifiableCredential }}
      />
    );

    await waitFor(async () => {
      const ethPlatformGroup = screen.getByTestId("ETH-add-btn");
      await fireEvent.click(ethPlatformGroup);
    });

    await waitFor(async () => {
      expect(screen.getByText("ETH")).toBeInTheDocument();
      expect(screen.getByText("Possessions")).toBeInTheDocument();
      expect(screen.getByText("Transactions")).toBeInTheDocument();
      expect(screen.getByText("Gas fees spent")).toBeInTheDocument();
    });
  });

  it("should attempt to fetch a verifiable credential when the verify button is clicked", async () => {
    render(
      <AdditionalStampModal
        onClose={() => {}}
        additionalSigner={{ addr: "0xasdf", sig: "", msg: "", challenge: {} as VerifiableCredential }}
      />
    );

    await waitFor(async () => {
      const ethPlatformGroup = screen.getByTestId("ETH-add-btn");
      await fireEvent.click(ethPlatformGroup);
    });

    await waitFor(async () => {
      const addAll = screen.getByTestId("add-all-btn");
      await fireEvent.click(addAll);
    });

    await waitFor(async () => {
      const addAll = screen.getByTestId("verify-btn");
      await fireEvent.click(addAll);
    });

    expect(fetchVerifiableCredential).toHaveBeenCalled();
  });
});
