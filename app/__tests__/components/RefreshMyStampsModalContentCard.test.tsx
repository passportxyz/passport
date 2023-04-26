import { render, screen, fireEvent } from "@testing-library/react";
import { RefreshMyStampsModalContentCard } from "../../components/RefreshMyStampsModalContentCard";
import { PlatformGroupSpec, PlatformSpec, PROVIDER_ID } from "@gitcoin/passport-platforms/src/types";
import { PLATFORM_ID } from "@gitcoin/passport-types";

beforeAll(() => {
  window.scrollTo = jest.fn();
});

const mockSetSelectedProviders = jest.fn();
const platformGroup: PlatformGroupSpec[] = [
  {
    providers: [
      {
        title: "Provider Title",
        name: "Ens" as PROVIDER_ID,
        icon: "provider-icon.png",
        description: "Provider description",
      },
    ],
    platformGroup: "Platform Group",
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

const selectedProviders: PROVIDER_ID[] = ["Ens"];

describe("RefreshMyStampsModalContentCard", () => {
  it("renders the component and handles switch change", () => {
    render(
      <RefreshMyStampsModalContentCard
        platformGroup={platformGroup}
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
        platformGroup={platformGroup}
        currentPlatform={currentPlatform}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
      />
    );

    const switchElement = screen.getByTestId(`switch-${currentPlatform.name}`);
    expect(switchElement).toHaveAttribute("data-checked");
  });
});
