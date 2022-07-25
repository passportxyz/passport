import { render } from "@testing-library/react";
import Index from "../../pages/index";

jest.mock("../../utils/onboard.ts");
jest.mock("@datadog/browser-rum");
jest.mock("@datadog/browser-logs");

const broadcastChannel = jest.spyOn(require("broadcast-channel"), "BroadcastChannel");

describe("when index is provided queryParams matching twitters OAuth response", () => {
  it("should postMessage to opener and close window", async () => {
    const mockPostMessage = jest.fn();
    const mockCloseWindow = jest.fn();

    // Mock query params
    Object.defineProperty(window, "location", {
      writable: false,
      value: {
        search: "?code=ABC&state=twitter-123",
      },
    });

    // Mock BroadcastChannel
    broadcastChannel.mockImplementation(() => ({
      postMessage: mockPostMessage,
    }));

    // Mock window.close
    Object.defineProperty(window, "close", {
      writable: false,
      value: mockCloseWindow,
    });

    render(<Index />);

    // expect message to be posted and window.close() to have been called
    expect(mockPostMessage).toBeCalledTimes(1);
    expect(mockCloseWindow).toBeCalledTimes(1);
  });
});
