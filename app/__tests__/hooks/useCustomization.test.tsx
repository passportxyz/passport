import { render, waitFor, screen } from "@testing-library/react";

import { DEFAULT_CUSTOMIZATION_KEY, useCustomization, useSetCustomizationKey } from "../../hooks/useCustomization";
import { DynamicCustomDashboardPanel } from "../../components/CustomDashboardPanel";
import { useEffect } from "react";

// Once we're using the API, we should mock the axios
// call (or however we do it) and return the data that
// is currently hardcoded in useDatastoreConnectionContext.tsx
// for testing

// mock the axios call
jest.mock("axios", () => {
  return {
    get: jest.fn((path) =>
      path.split("/").slice(-1)[0] === "invalid" ? Promise.reject() : Promise.resolve({ data: {} })
    ),
  };
});

const TestingComponent = ({ customizationKey }: { customizationKey: string }) => {
  const customization = useCustomization();
  const { useCustomDashboardPanel, customizationTheme, key } = customization;
  const setCustomizationKey = useSetCustomizationKey();

  useEffect(() => {
    setCustomizationKey(customizationKey);
  }, [customizationKey, setCustomizationKey]);

  return (
    <div>
      <div data-testid="customizationKey">{key}</div>
      <div data-testid="useCustomDashboardPanel">{useCustomDashboardPanel ? "true" : "false"}</div>
      <div data-testid="customizationThemeBackgroundColor1">{customizationTheme?.colors?.customizationBackground1}</div>
      {useCustomDashboardPanel && <DynamicCustomDashboardPanel className="" />}
    </div>
  );
};

describe("useCustomization", () => {
  it("should render panel for API-defined customization", async () => {
    render(<TestingComponent customizationKey="avalanche" />);
    await waitFor(() => {
      expect(document.querySelector("[data-testid=customizationKey]")?.textContent).toBe("avalanche");
      expect(document.querySelector("[data-testid=useCustomDashboardPanel]")?.textContent).toBe("true");
      expect(document.querySelector("[data-testid=customizationThemeBackgroundColor1]")?.textContent).toBe("232 65 66");
      expect(document.querySelector("html")).toHaveStyle("--color-customization-background-1: 232 65 66");

      expect(
        screen.getByText((str) => str.includes("The Avalanche Community Grant Rounds require"))
      ).toBeInTheDocument();
    });
  });

  it("should render panel for hardcoded customization", async () => {
    render(<TestingComponent customizationKey="testing" />);
    await waitFor(() => {
      expect(document.querySelector("[data-testid=customizationKey]")?.textContent).toBe("testing");
      expect(document.querySelector("[data-testid=useCustomDashboardPanel]")?.textContent).toBe("true");
      expect(document.querySelector("[data-testid=customizationThemeBackgroundColor1]")?.textContent).toBe(
        "var(--color-focus)"
      );
      expect(document.querySelector("html")).toHaveStyle("--color-customization-background-1: var(--color-focus)");

      expect(screen.getByText((str) => str.includes("Click below to enable test mode"))).toBeInTheDocument();
    });
  });

  it("should cleanly ignore invalid customizationKey", async () => {
    render(<TestingComponent customizationKey="invalid" />);
    await waitFor(() => {
      expect(document.querySelector("[data-testid=customizationKey]")?.textContent).toBe(DEFAULT_CUSTOMIZATION_KEY);
      expect(document.querySelector("[data-testid=useCustomDashboardPanel]")?.textContent).toBe("false");
    });
  });
});
