import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { UserContext, UserContextState } from "../../context/userContext";
import { CardList, CardListProps } from "../../components/CardList";
import { STAMP_PROVIDERS } from "../../config/providers";

jest.mock("../../utils/onboard.ts");

// Mock isLoadingPassport in each describes beforeEach
const mockUserContext: UserContextState = {
  address: undefined,
  handleAddStamp: jest.fn(),
  handleConnection: jest.fn(),
  handleCreatePassport: jest.fn(),
  signer: undefined,
  wallet: null,
  walletLabel: undefined,
  userDid: undefined,
  loggedIn: true,
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
    Github: {
      providerSpec: STAMP_PROVIDERS.Github,
      stamp: undefined,
    },
  },
};

let cardListProps: CardListProps = {};

describe("<CardList />", () => {
  beforeEach(() => {
    cardListProps = {};
  });

  it("renders provider cards when not loading", async () => {
    await act(
      async () =>
        render(
          <MemoryRouter>
            <UserContext.Provider value={mockUserContext}>
              <CardList {...cardListProps} />
            </UserContext.Provider>
          </MemoryRouter>
        ) as any
    );

    expect(screen.queryByTestId("loading-card")).not.toBeInTheDocument();
  });

  it("renders LoadingCards when loading the passport", async () => {
    cardListProps.isLoading = true;
    await act(
      async () =>
        render(
          <UserContext.Provider value={mockUserContext}>
            <CardList {...cardListProps} />
          </UserContext.Provider>
        ) as any
    );

    expect(screen.getAllByTestId("loading-card"));
  });
});
