import { render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import App from "../../pages/_app";
import { AppProps } from "next/app";

vi.mock("@datadog/browser-rum");
vi.mock("@datadog/browser-logs");
vi.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: vi.fn(),
  },
}));

const mockPostMessage = vi.fn();
vi.mock("broadcast-channel", () => {
  return {
    BroadcastChannel: vi.fn().mockImplementation(() => {
      return {
        postMessage: mockPostMessage,
      };
    }),
  };
});

describe("when index is provided queryParams matching twitters OAuth response", () => {
  it("should postMessage to opener and close window", async () => {
    const mockCloseWindow = vi.fn();

    // Mock query params
    Object.defineProperty(window, "location", {
      writable: false,
      value: {
        search: "?code=ABC&state=twitter-123",
      },
    });

    // Mock window.close
    Object.defineProperty(window, "close", {
      writable: false,
      value: mockCloseWindow,
    });

    const appProps = {} as AppProps;

    render(<App {...appProps} />);

    // expect message to be posted and window.close() to have been called
    expect(mockPostMessage).toBeCalledTimes(1);
    expect(mockCloseWindow).toBeCalledTimes(1);
  });
});
