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
    get: jest.fn((path) => {
      const key = path.split("/").slice(-1)[0];
      if (key === "avalanche") {
        return Promise.resolve({
          data: {
            key: "avalanche",
            useCustomDashboardPanel: true,
            dashboardPanel: {
              logo: {
                image: (
                  <svg viewBox="0 0 70 87" fill="none" xmlns="http://www.w3.org/2000/svg" width="80px" height="90px">
                    <path
                      d="M2.82863 80.0977H3.82968L6.63074 86.4684H5.30828L4.70213 85.0106H1.88269L1.29493 86.4684H0L2.82863 80.0977ZM4.29804 84.0391L3.29701 81.4473L2.2776 84.0391H4.29804Z"
                      fill="rgb(var(--color-customization-foreground-1))"
                    />
                  </svg>
                ),
                background: "dots",
              },
              body: {
                mainText: `The Avalanche Community Grant Rounds require you to achieve a score greater than 25 to qualify
            for voting. The only way to reach this score is to complete identification via Civic or Holonym.`,
                subText: (
                  <div>
                    You can{" "}
                    <a
                      href="https://t.me/avalanchegrants"
                      style={{ color: "rgb(var(--color-text-2))", textDecoration: "underline" }}
                      target="_blank"
                    >
                      join Avalanche on telegram
                    </a>{" "}
                    if you have any questions or need support.
                  </div>
                ),
                action: {
                  text: "Avalanche Grants",
                  url: "https://grants.avax.network/",
                },
              },
            },
            customizationTheme: {
              colors: {
                customizationBackground1: "232 65 66",
                customizationBackground2: "0 0 0",
                customizationForeground1: "255 255 255",
                customizationForeground2: "255 255 255",
                customizationBackground3: "255 136 70",
              },
            },
          },
        });
      }
      if (key === "testing") {
        return Promise.resolve({
          data: {
            key: "testing",
            useCustomDashboardPanel: true,
            dashboardPanel: {
              logo: {
                image: (
                  <svg viewBox="0 0 70 87" fill="none" xmlns="http://www.w3.org/2000/svg" width="80px" height="90px">
                    <path
                      d="M2.82863 80.0977H3.82968L6.63074 86.4684H5.30828L4.70213 85.0106H1.88269L1.29493 86.4684H0L2.82863 80.0977ZM4.29804 84.0391L3.29701 81.4473L2.2776 84.0391H4.29804Z"
                      fill="rgb(var(--color-customization-foreground-1))"
                    />
                  </svg>
                ),
                background: "dots",
              },
              body: {
                mainText: `The Avalanche Community Grant Rounds require you to achieve a score greater than 25 to qualify
            for voting. The only way to reach this score is to complete identification via Civic or Holonym.`,
                subText: (
                  <div>
                    You can{" "}
                    <a
                      href="https://t.me/avalanchegrants"
                      style={{ color: "rgb(var(--color-text-2))", textDecoration: "underline" }}
                      target="_blank"
                    >
                      join Avalanche on telegram
                    </a>{" "}
                    if you have any questions or need support.
                  </div>
                ),
                action: {
                  text: "Avalanche Grants",
                  url: "https://grants.avax.network/",
                },
              },
            },
            customizationTheme: {
              colors: {
                customizationBackground1: "255 136 70",
                customizationBackground2: "255 136 70",
                customizationForeground1: "255 255 255",
                customizationForeground2: "255 255 255",
                customizationBackground3: "255 136 70",
              },
            },
          },
        });
      }
      return Promise.resolve({});
    }),
  };
});

const TestingComponent = ({ customizationKey }: { customizationKey?: string }) => {
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
        "255 136 70"
      );
      expect(document.querySelector("html")).toHaveStyle("--color-customization-background-1: 255 136 70");

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
