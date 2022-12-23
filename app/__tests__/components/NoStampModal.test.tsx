import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NoStampModal, NoStampModalProps } from "../../components/NoStampModal";
import { fetchAdditionalSigner } from "../../signer/utils";

jest.mock("../../signer/utils", () => ({
  fetchAdditionalSigner: jest.fn(),
  fetchPossibleEVMStamps: jest.fn(),
}));

jest.mock("../../components/AdditionalStampModal", () => ({
  AdditionalStampModal: () => <div>Additional Stamp Modal</div>,
}));

jest.mock("../../utils/onboard.ts");

let props: NoStampModalProps;

beforeEach(() => {
  props = {
    isOpen: true,
    onClose: jest.fn(),
  };

  (fetchAdditionalSigner as jest.Mock).mockResolvedValue({ cred: "yo" });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("NoStampModal", () => {
  describe("linking another account", () => {
    it("opens", () => {
      render(<NoStampModal {...props} />);
      expect(screen.getByText("No Stamp Found")).toBeInTheDocument();
    });
    it("initiates account change when requested", async () => {
      (fetchAdditionalSigner as jest.Mock).mockResolvedValue({ cool: true });
      render(<NoStampModal {...props} />);
      fireEvent.click(screen.getByTestId("check-other-wallet")!);
      await waitFor(() => {
        expect(fetchAdditionalSigner).toHaveBeenCalled();
      });
    });
    it("links to ENS website", () => {
      render(<NoStampModal {...props} />);
      fireEvent.click(screen.getByText("Go to ENS"));
      expect(props.onClose).toHaveBeenCalled();
    });
    it("should show stamps for additional wallet", async () => {
      (fetchAdditionalSigner as jest.Mock).mockResolvedValue({ addr: "string", sig: "string", msg: "string" });
      render(<NoStampModal {...props} />);
      fireEvent.click(screen.getByTestId("check-other-wallet")!);
      await waitFor(() => {
        expect(screen.getByText("Additional Stamp Modal")).toBeInTheDocument();
      });
    });
  });
});
