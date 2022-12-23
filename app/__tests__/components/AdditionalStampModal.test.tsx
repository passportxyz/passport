import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdditionalStampModal } from "../../components/AdditionalStampModal";
import { fetchPossibleEVMStamps } from "../../signer/utils";
import { VALID_ENS_VERIFICATION, VALID_LENS_VERIFICATION } from "../../__test-fixtures__/verifiableCredentialResults";

jest.mock("../../utils/onboard.ts");

jest.mock("../../signer/utils", () => ({
  fetchPossibleEVMStamps: jest.fn(),
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

describe("AdditionalStampModal", () => {
  beforeEach(() => {
    (fetchPossibleEVMStamps as jest.Mock).mockResolvedValue(mockPossibleEVMStamps);
  });

  it("renders a list of possible platforms", () => {
    render(<AdditionalStampModal additionalSigner={{ addr: "0xasdf", sig: "", msg: "" }} />);
    expect(screen.getByText("Stamp Verification")).toBeInTheDocument();
    expect(screen.getByText("0xasdf")).toBeInTheDocument();
  });
});
