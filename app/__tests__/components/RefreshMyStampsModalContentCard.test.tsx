import { render, screen, fireEvent } from "@testing-library/react";
import { RefreshMyStampsModalContentCard } from "../../components/RefreshMyStampsModalContentCard";
import { PlatformSpec } from "@gitcoin/passport-platforms/src/types";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { ValidatedProviderGroup } from "../../signer/utils";

beforeAll(() => {
  window.scrollTo = jest.fn();
});

const mockSetSelectedProviders = jest.fn();
const platformGroups: ValidatedProviderGroup[] = [
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

const currentPlatform: PlatformSpec = {
  icon: "platform-icon.png",
  platform: "ENS" as PLATFORM_ID,
  name: "Platform Name",
  description: "Platform description",
  connectMessage: "Connect message",
  isEVM: false,
  enablePlatformCardUpdate: false,
};

const selectedProviders: PROVIDER_ID[] = ["FirstEthTxnProvider"];

describe("RefreshMyStampsModalContentCard", () => {
  it("renders the component and handles switch change", () => {
    render(
      <RefreshMyStampsModalContentCard
        platformGroups={platformGroups}
        currentPlatform={currentPlatform}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
      />
    );

    const switchElement = screen.getByTestId(`switch-${currentPlatform.name}`);
    expect(switchElement).toBeInTheDocument();

    fireEvent.click(switchElement);
    expect(mockSetSelectedProviders).toHaveBeenCalled();
  });

  it("should mark switch as checked if selectedProviders are passed as props", () => {
    render(
      <RefreshMyStampsModalContentCard
        platformGroups={platformGroups}
        currentPlatform={currentPlatform}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
      />
    );

    const switchElement = screen.getByTestId(`switch-${currentPlatform.name}`);
    expect(switchElement).toHaveAttribute("data-headlessui-state", "checked");
  });
});
