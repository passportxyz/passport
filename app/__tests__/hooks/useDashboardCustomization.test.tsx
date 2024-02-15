import { render, waitFor, screen } from "@testing-library/react";

import { useDashboardCustomization } from "../../hooks/useDashboardCustomization";
import { DynamicCustomDashboardPanel } from "../../components/CustomDashboardPanel";

// Once we're using the API, we should mock the axios
// call (or however we do it) and return the data that
// is currently hardcoded in useDatastoreConnectionContext.tsx
// for testing

const TestingComponent = ({ customizationKey }: { customizationKey: string }) => {
  const { customizationEnabled, customizationConfig } = useDashboardCustomization(customizationKey);
  const { useCustomDashboardPanel, customizationTheme } = customizationConfig;

  return (
    <div>
      <div data-testid="customizationEnabled">{customizationEnabled ? "Enabled" : "Disabled"}</div>
      <div data-testid="useCustomDashboardPanel">{useCustomDashboardPanel ? "true" : "false"}</div>
      <div data-testid="customizationThemeBackgroundColor1">{customizationTheme?.colors?.customizationBackground1}</div>
      {useCustomDashboardPanel && <DynamicCustomDashboardPanel customizationKey={customizationKey} className="" />}
    </div>
  );
};

describe("useDashboardCustomization", () => {
  it("should render panel for API-defined customization", async () => {
    render(<TestingComponent customizationKey="avalanche" />);
    await waitFor(() => {
      expect(document.querySelector("[data-testid=customizationEnabled]")?.textContent).toBe("Enabled");
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
      expect(document.querySelector("[data-testid=customizationEnabled]")?.textContent).toBe("Enabled");
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
      expect(document.querySelector("[data-testid=customizationEnabled]")?.textContent).toBe("Disabled");
      expect(document.querySelector("[data-testid=useCustomDashboardPanel]")?.textContent).toBe("false");
    });
  });
});
