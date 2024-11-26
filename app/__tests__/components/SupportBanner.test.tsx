import { screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import axios from "axios";
import { useEffect } from "react";
import { SupportBanner } from "../../components/SupportBanner";
import { CeramicContextState } from "../../context/ceramicContext";
import { useSupportBanners } from "../../hooks/useSupportBanners";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";

const mockBannerResponse = [
  {
    name: "Water Bottles",
    content: "We are selling sweet water bottles",
    link: "https://www.kleankanteen.com/",
    banner_id: 1,
  },
];

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

const TestComponent = () => {
  const { banners, loadBanners } = useSupportBanners();

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  return <SupportBanner banners={banners} />;
};

describe("SupportBanner", () => {
  it("should render banner", async () => {
    vi.spyOn(axios, "get").mockResolvedValueOnce({ data: mockBannerResponse });
    renderWithContext(mockCeramicContext, <TestComponent />, { dbAccessTokenStatus: "connected" });

    await screen.findByText(mockBannerResponse[0].content);
  });

  it("should render banner with link", async () => {
    vi.spyOn(axios, "get").mockResolvedValueOnce({ data: mockBannerResponse });
    renderWithContext(mockCeramicContext, <TestComponent />, { dbAccessTokenStatus: "connected" });

    const link = await screen.findByText("More information.");
    expect(link).toHaveAttribute("href", mockBannerResponse[0].link);
  });

  it("should dismiss banner", async () => {
    const dismissCall = vi.spyOn(axios, "post");
    dismissCall.mockResolvedValueOnce({}); // Mock axios.post to resolve immediately

    vi.spyOn(axios, "get").mockResolvedValueOnce({ data: mockBannerResponse });

    renderWithContext(mockCeramicContext, <TestComponent />, { dbAccessTokenStatus: "connected" });
    const dismissBtn = await screen.findByText("Dismiss");
    fireEvent.click(dismissBtn);
    await waitFor(() => expect(dismissCall).toHaveBeenCalled());
  });
});
