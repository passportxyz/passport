import { render } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import App from "../../pages/_app";
import { AppProps } from "next/app";

vi.mock("@datadog/browser-rum");
vi.mock("@datadog/browser-logs");
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

describe("when index is provided Steam OpenID query params", () => {
  it("should postMessage the full OpenID query string and close window", async () => {
    mockPostMessage.mockClear();
    const mockCloseWindow = vi.fn();
    const search =
      "?openid.claimed_id=https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F76561198000000000&openid.mode=id_res&openid.sig=abc&state=steam-123";

    Object.defineProperty(window, "location", {
      writable: true,
      value: { search },
    });
    Object.defineProperty(window, "close", {
      writable: true,
      value: mockCloseWindow,
    });

    const appProps = {} as AppProps;
    render(<App {...appProps} />);

    expect(mockPostMessage).toBeCalledTimes(1);
    const posted = mockPostMessage.mock.calls[0][0];
    expect(posted.target).toBe("steam");
    expect(posted.data.code).toContain("steamcommunity.com/openid/id/");
    expect(posted.data.openid).toContain("openid.claimed_id=");
    expect(posted.data.openid).toContain("openid.sig=");
    expect(mockCloseWindow).toBeCalledTimes(1);
  });
});
