import { PROVIDER_ID } from "@gitcoin/passport-types";
import { buildAllowListProviders } from "../../utils/customizationUtils";

describe("buildAllowListProviders", () => {
  it("returns an empty array when no weights are provided", () => {
    const result = buildAllowListProviders();
    expect(result).toEqual([]);
  });

  it('returns an empty array when no keys match "AllowList"', () => {
    const weights = {
      OtherList1: "100",
      OtherList2: "200",
    } as unknown as Record<PROVIDER_ID, string>;
    const result = buildAllowListProviders(weights);
    expect(result).toEqual([]);
  });

  it('returns array of providers for keys starting with "AllowList"', () => {
    const weights = {
      "AllowList#1": "100",
      "AllowList#2": "200",
      AnotherKey: "300",
    } as unknown as Record<PROVIDER_ID, string>;
    const result = buildAllowListProviders(weights);
    expect(result).toHaveLength(2);
    expect(result).toMatchObject([
      {
        platformGroup: "Custom Allow Lists",
        providers: [
          {
            title: "Allow List Provider",
            description: "Check to see if you are on the Guest List.",
            name: "AllowList#1",
          },
        ],
      },
      {
        platformGroup: "Custom Allow Lists",
        providers: [
          {
            title: "Allow List Provider",
            description: "Check to see if you are on the Guest List.",
            name: "AllowList#2",
          },
        ],
      },
    ]);
  });
});
