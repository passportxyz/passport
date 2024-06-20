import { parseValidChains } from "../../components/OnchainSidebar";
import { Customization } from "../../utils/customizationUtils";

const customization = {
  includedChainIds: ["1", "2", "3"],
  dashboardPanel: {},
} as unknown as Customization;

describe("Displaying Chains", () => {
  it("should return true if the chain is included in the customization", () => {
    expect(parseValidChains(customization, "1")).toBe(true);
  });

  it("should return false if the chain is not included in the customization", () => {
    expect(parseValidChains(customization, "4")).toBe(false);
  });

  it("should return true if customization is not present", () => {
    expect(parseValidChains({} as Customization, "1")).toBe(true);
  });
});
