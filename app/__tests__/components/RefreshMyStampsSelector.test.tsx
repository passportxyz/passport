import { vi, describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RefreshMyStampsSelector } from "../../components/RefreshMyStampsSelector";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { ValidatedProviderGroup } from "../../signer/utils";

const mockSetSelectedProviders = vi.fn();

const validPlatformGroups: ValidatedProviderGroup[] = [
  {
    name: "Platform Group",
    providers: [
      {
        name: "FirstEthTxnProvider",
        title: "First Eth Txn",
      },
    ],
  },
];

const selectedProviders: PROVIDER_ID[] = ["FirstEthTxnProvider"];

describe("RefreshMyStampsSelector", () => {
  it("renders the component and handles checkbox change", () => {
    render(
      <RefreshMyStampsSelector
        validPlatformGroups={validPlatformGroups}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
        platformChecked={true}
      />
    );

    const checkboxElement = screen.getByTestId(`checkbox-${validPlatformGroups[0].providers[0].name}`);
    expect(checkboxElement).toBeInTheDocument();

    fireEvent.click(checkboxElement);
    expect(mockSetSelectedProviders).toHaveBeenCalled();
  });

  it("should mark checkbox as checked if selectedProviders are passed as props", () => {
    render(
      <RefreshMyStampsSelector
        validPlatformGroups={validPlatformGroups}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
        platformChecked={true}
      />
    );

    const checkboxElement = screen.getByTestId(`checkbox-${validPlatformGroups[0].providers[0].name}`);
    expect(checkboxElement).toHaveAttribute("data-headlessui-state", "checked");
  });

  it("should disable checkboxes if platformChecked is false", () => {
    render(
      <RefreshMyStampsSelector
        validPlatformGroups={validPlatformGroups}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
        platformChecked={false}
      />
    );

    const checkboxElement = screen.getByTestId(`checkbox-${validPlatformGroups[0].providers[0].name}`);
    expect(checkboxElement).toHaveAttribute("disabled");
  });
});
