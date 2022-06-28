import { render } from "@testing-library/react";
import { STAMP_PROVIDERS } from "../../config/providers";
import { UserContext, UserContextState } from "../../context/userContext";
import Index from "../../pages/index";

jest.mock("../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const handleAddStamp = jest.fn();
const mockUserContext: UserContextState = {
  userDid: undefined,
  loggedIn: false,
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
  },
  isLoadingPassport: false,
  allProvidersState: {
    Google: {
      providerSpec: STAMP_PROVIDERS.Google,
      stamp: undefined,
    },
    Ens: {
      providerSpec: STAMP_PROVIDERS.Ens,
      stamp: undefined,
    },
    Poh: {
      providerSpec: STAMP_PROVIDERS.Poh,
      stamp: undefined,
    },
    Twitter: {
      providerSpec: STAMP_PROVIDERS.Twitter,
      stamp: undefined,
    },
    POAP: {
      providerSpec: STAMP_PROVIDERS.POAP,
      stamp: undefined,
    },
    Facebook: {
      providerSpec: STAMP_PROVIDERS.Facebook,
      stamp: undefined,
    },
    Brightid: {
      providerSpec: STAMP_PROVIDERS.Brightid,
      stamp: undefined,
    },
    GoodDollar: {
      providerSpec: STAMP_PROVIDERS.GoodDollar,
      stamp: undefined,
    },
  },
  handleAddStamp: handleAddStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: undefined,
  wallet: null,
  signer: undefined,
  walletLabel: undefined,
};

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

    render(
      <UserContext.Provider value={mockUserContext}>
        <Index />
      </UserContext.Provider>
    );

    // expect message to be posted and window.close() to have been called)
    expect(mockPostMessage).toBeCalledTimes(1);
    expect(mockCloseWindow).toBeCalledTimes(1);
  });
});
