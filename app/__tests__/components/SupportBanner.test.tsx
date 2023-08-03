import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { SupportBanner } from "../../components/SupportBanner";
import { CeramicContextState } from "../../context/ceramicContext";
import { UserContextState } from "../../context/userContext";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";

jest.mock("../../utils/onboard.ts");

const mockBannerResponse = [
  {
    name: "Water Bottles",
    content: "We are selling sweet water bottles",
    link: "https://www.kleankanteen.com/",
    banner_id: 1,
  },
];

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("SupportBanner", () => {
  it("should render banner", async () => {
    jest.spyOn(axios, "get").mockResolvedValueOnce({ data: mockBannerResponse });
    renderWithContext({ ...mockUserContext, dbAccessTokenStatus: "connected" }, mockCeramicContext, <SupportBanner />);

    await screen.findByText(mockBannerResponse[0].content);
  });
  it("should render banner with link", async () => {
    jest.spyOn(axios, "get").mockResolvedValueOnce({ data: mockBannerResponse });
    renderWithContext({ ...mockUserContext, dbAccessTokenStatus: "connected" }, mockCeramicContext, <SupportBanner />);

    const link = await screen.findByText("More information.");
    expect(link).toHaveAttribute("href", mockBannerResponse[0].link);
  });
  it("should dismiss banner", async () => {
    const dismissCall = jest.spyOn(axios, "post");
    dismissCall.mockResolvedValueOnce({}); // Mock axios.post to resolve immediately

    jest.spyOn(axios, "get").mockResolvedValueOnce({ data: mockBannerResponse });

    renderWithContext({ ...mockUserContext, dbAccessTokenStatus: "connected" }, mockCeramicContext, <SupportBanner />);
    const dismissBtn = await screen.findByText("Dismiss");
    fireEvent.click(dismissBtn);
    await waitFor(() => expect(dismissCall).toHaveBeenCalled());
  });
});
