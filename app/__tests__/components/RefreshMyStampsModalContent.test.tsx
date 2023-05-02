import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { RefreshMyStampsModalContent } from "../../components/RefreshMyStampsModalContent";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";

import { useNavigate } from "react-router-dom";
import { ValidatedPlatform } from "../../signer/utils";

import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import { reduceStampResponse } from "../../utils/helpers";
import { CredentialResponseBody } from "@gitcoin/passport-types";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));

const navigateMock = jest.fn();

(useNavigate as jest.Mock).mockReturnValue(navigateMock);

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

const mockOnClose = jest.fn();
const mockResetStampsAndProgressState = jest.fn();
const mockUserContext = makeTestUserContext();
const mockCeramicContext = makeTestCeramicContext();

jest.mock("../../utils/onboard.ts");

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("../../components/RefreshMyStampsModalContentCardList.tsx", () => ({
  RefreshMyStampsModalContentCardList: () => <div>RefreshMyStampsModalContentCardList</div>,
}));

const validPlatforms: ValidatedPlatform[] = [
  {
    groups: [
      {
        name: "Eth",
        providers: [
          {
            name: "FirstEthTxnProvider",
            title: "First Eth Txn",
          },
        ],
      },
    ],
    platformProps: {
      platform: {} as any,
      platFormGroupSpec: [
        {
          platformGroup: "Eth",
          providers: [
            {
              name: "FirstEthTxnProvider",
              title: "First Eth Txn",
            },
          ],
        },
      ],
    },
  },
];

describe("RefreshMyStampsModalContent", () => {
  it("renders the Stamps Found title when validPlatforms are provided", () => {
    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <RefreshMyStampsModalContent
        onClose={mockOnClose}
        validPlatforms={validPlatforms}
        resetStampsAndProgressState={mockResetStampsAndProgressState}
      />
    );
    expect(screen.getByText(/Stamps Found/i)).toBeInTheDocument();
  });

  it("calls handleRefreshSelectedStamps when the 'Confirm Stamps' button is clicked", async () => {
    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <RefreshMyStampsModalContent
        onClose={mockOnClose}
        validPlatforms={validPlatforms}
        resetStampsAndProgressState={mockResetStampsAndProgressState}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Confirm Stamps/i }));
    await waitFor(() =>
      expect(fetchVerifiableCredential).toHaveBeenCalledWith(
        iamUrl,
        {
          type: "EVMBulkVerify",
          types: ["FirstEthTxnProvider"],
          version: "0.0.0",
          address: "0xmyAddress",
          proofs: {},
        },
        undefined
      )
    );
  });

  it("shows and hides the data storage info when the 'How is my data stored?' link is clicked", () => {
    renderWithContext(
      mockUserContext,
      mockCeramicContext,
      <RefreshMyStampsModalContent
        onClose={mockOnClose}
        validPlatforms={validPlatforms}
        resetStampsAndProgressState={mockResetStampsAndProgressState}
      />
    );

    const dataStorageLink = screen.getByText(/How is my data stored\?/i);
    fireEvent.click(dataStorageLink);
    expect(screen.getByText(/The only information in your passport/i)).toBeInTheDocument();

    fireEvent.click(dataStorageLink);
    expect(() => screen.getByText(/The only information in your passport/i)).toThrow();
  });

  it("should return array of verified vcs from fetch response", async () => {
    expect(
      reduceStampResponse(["ethPossessionsGte#32", "FirstEthTxnProvider"], [
        {
          error: "Unable to verify proofs",
          code: 403,
        },
        {
          record: {
            type: "FirstEthTxnProvider",
            version: "0.0.0",
            address: "0xc79abb54e4824cdb65c71f2eeb2d7f2db5da1fb8",
            hasGTE30DaysSinceFirstTxnOnTheMainnet: "true",
          },
          credential: {} as any,
        },
      ] as CredentialResponseBody[])
    ).toEqual([
      {
        provider: "FirstEthTxnProvider",
        credential: {},
      },
    ]);
  });
});
