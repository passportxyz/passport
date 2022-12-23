import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdditionalStampModal } from "../../components/AdditionalStampModal";
import { fetchPossibleEVMStamps } from "../../signer/utils";
import { VALID_ENS_VERIFICATION, VALID_LENS_VERIFICATION } from "../../__test-fixtures__/verifiableCredentialResults";

jest.mock("../../utils/onboard.ts");

jest.mock("../../signer/utils", () => ({
  fetchPossibleEVMStamps: jest.fn(),
}));

describe("AdditionalStampModal", () => {
  beforeEach(() => {
    (fetchPossibleEVMStamps as jest.Mock).mockResolvedValue([VALID_ENS_VERIFICATION, VALID_LENS_VERIFICATION]);
  });

  it("renders a list of possible platforms", () => {
    render(<AdditionalStampModal additionalSigner={{ addr: "0xasdf", sig: "", msg: "" }} />);
    expect(screen.getByText("Stamp Verification")).toBeInTheDocument();
    expect(screen.getByText("0xasdf")).toBeInTheDocument();
  });
});
