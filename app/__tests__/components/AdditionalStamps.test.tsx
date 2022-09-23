// testing
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { mock } from "jest-mock-extended";

// libs
import { JsonRpcSigner } from "@ethersproject/providers";

// components
import { AdditionalStamps } from "../../components/AdditionalStamps";

// utils
import { AdditionalSignature, EVMStamps, fetchPossibleEVMStamps } from "../../signer/utils";

jest.mock("../../signer/utils", () => ({
  fetchPossibleEVMStamps: jest.fn(),
}));

const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const additionalStamps: EVMStamps[] = [
  {
    payload: {
      valid: false,
      record: {},
    },
    providerType: "gtcPossessionsGte#100",
    platformType: "GTC",
  },
  {
    payload: {
      valid: false,
      record: {},
    },
    providerType: "gtcPossessionsGte#10",
    platformType: "GTC",
  },
  {
    payload: {
      valid: false,
      record: {},
    },
    providerType: "ethPossessionsGte#32",
    platformType: "ETH",
  },
  {
    payload: {
      valid: false,
      record: {},
    },
    providerType: "ethPossessionsGte#10",
    platformType: "ETH",
  },
  {
    payload: {
      valid: true,
      record: {
        address: "0x509c34f1d27f240c3cda3711232583d4ba4d7146",
        ethPossessionsGte: "1",
      },
    },
    providerType: "ethPossessionsGte#1",
    platformType: "ETH",
  },
  {
    payload: {
      valid: false,
      error: ["Ens name was not found for given address."],
    },
    providerType: "Ens",
    platformType: "Ens",
  },
];
const additionalSigner = { addr: "0x6Cc41e662668C733c029d3c70E9CF248359ce544" } as AdditionalSignature;
describe("AdditionalStamps", () => {
  beforeEach(() => {
    (fetchPossibleEVMStamps as jest.Mock).mockResolvedValue(additionalStamps);
  });
  describe("fetches all possible evm stamps", () => {
    it("calls fetchPossibleStamps with address", async () => {
      render(<AdditionalStamps additionalSigner={additionalSigner} />);
      await waitFor(() => {
        expect(fetchPossibleEVMStamps).toBeCalledWith(additionalSigner.addr);
      });
    });
    it("renders possible providers", async () => {
      render(<AdditionalStamps additionalSigner={additionalSigner} />);
      await waitFor(() => {
        expect(screen.getByText("ETH")).toBeInTheDocument();
      });
    });
  });
});
