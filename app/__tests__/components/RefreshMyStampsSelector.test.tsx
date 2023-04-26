import { render, screen, fireEvent } from "@testing-library/react";
import { RefreshMyStampsSelector } from "../../components/RefreshMyStampsSelector";
import { PlatformGroupSpec, PlatformSpec, PROVIDER_ID } from "@gitcoin/passport-platforms/src/types";

const mockSetSelectedProviders = jest.fn();

const currentProviders: PlatformGroupSpec[] = [
  {
    platformGroup: "Platform Group",
    providers: [
      {
        title: "Provider Title",
        name: "Ens" as PROVIDER_ID,
        icon: "provider-icon.png",
        description: "Provider description",
      },
    ],
  },
];

const selectedProviders: PROVIDER_ID[] = ["Ens"];

describe("RefreshMyStampsSelector", () => {
  it("renders the component and handles checkbox change", () => {
    render(
      <RefreshMyStampsSelector
        currentProviders={currentProviders}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
        platformChecked={true}
      />
    );

    const checkboxElement = screen.getByTestId(`checkbox-${currentProviders[0].providers[0].name}`);
    expect(checkboxElement).toBeInTheDocument();

    fireEvent.click(checkboxElement);
    expect(mockSetSelectedProviders).toHaveBeenCalled();
  });

  it("should mark checkbox as checked if selectedProviders are passed as props", () => {
    render(
      <RefreshMyStampsSelector
        currentProviders={currentProviders}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
        platformChecked={true}
      />
    );

    const checkboxElement = screen.getByTestId(`checkbox-${currentProviders[0].providers[0].name}`);
    expect(checkboxElement).toHaveAttribute("data-checked");
  });

  it("should disable checkboxes if platformChecked is false", () => {
    render(
      <RefreshMyStampsSelector
        currentProviders={currentProviders}
        selectedProviders={selectedProviders}
        setSelectedProviders={mockSetSelectedProviders}
        platformChecked={false}
      />
    );

    const checkboxElement = screen.getByTestId(`checkbox-${currentProviders[0].providers[0].name}`);
    expect(checkboxElement).toHaveAttribute("disabled");
  });
});
