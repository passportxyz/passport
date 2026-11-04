import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const get = vi.fn();
let dbAccessToken: string | undefined = "session-token";

vi.mock("axios", () => ({ default: { get: (...args: unknown[]) => get(...args) } }));
vi.mock("../../config/stamp_config", () => ({ CERAMIC_CACHE_ENDPOINT: "https://scorer.test/ceramic-cache" }));
vi.mock("../../context/datastoreConnectionContext", () => ({
  useDatastoreConnectionContext: () => ({ dbAccessToken }),
}));

import { useLinkedWalletScores } from "../../hooks/useLinkedWalletScores";

const A = "0xAaaa000000000000000000000000000000000001";
const B = "0xBbbb000000000000000000000000000000000002";

const render = (addresses: string[]) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useLinkedWalletScores(addresses), { wrapper });
};

describe("useLinkedWalletScores", () => {
  beforeEach(() => {
    get.mockReset();
    dbAccessToken = "session-token";
  });

  // One request per wallet, like the WaaP panel, until the scorer's group scoring is on.
  it("asks the scorer once per linked wallet with the user's session", async () => {
    get.mockResolvedValue({ data: { score: "0", stamps: {} } });

    const { result } = render([A, B]);

    await waitFor(() => expect(result.current.every((w) => w.data)).toBe(true));
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenCalledWith(`https://scorer.test/ceramic-cache/score/${A}`, {
      headers: { Authorization: "Bearer session-token" },
    });
    expect(get).toHaveBeenCalledWith(`https://scorer.test/ceramic-cache/score/${B}`, expect.anything());
  });

  it("shows the wallet's own score, points and the stamps that count", async () => {
    get.mockResolvedValue({
      data: {
        score: "23.45678",
        points_data: { total_points: 250 },
        stamps: {
          Google: { score: "0.52500", dedup: false, expiration_date: "2026-12-04T10:00:00Z" },
          Github: { score: "0.00000", dedup: true }, // counted on another wallet
          Discord: { score: "0.00000", dedup: false }, // expired or zero weight
          Linkedin: { score: "1.20000", dedup: false },
        },
      },
    });

    const { result } = render([A]);

    await waitFor(() =>
      expect(result.current[0].data).toEqual({
        score: "23.5",
        points: "250",
        creds: "2",
        stamps: [
          { provider: "Google", points: "0.5", expires: "2026-12-04T10:00:00Z" },
          { provider: "Linkedin", points: "1.2", expires: null },
        ],
      })
    );
  });

  it("reports a wallet with no score as zeros", async () => {
    get.mockResolvedValue({ data: { score: null, stamps: null } });

    const { result } = render([A]);

    await waitFor(() => expect(result.current[0].data).toEqual({ score: "0", points: "0", creds: "0", stamps: [] }));
  });

  it("reports a failed request instead of zeros", async () => {
    get.mockRejectedValue(new Error("500"));

    const { result } = render([A]);

    // The hook retries once (about a second) before reporting the failure.
    await waitFor(() => expect(result.current[0].isError).toBe(true), { timeout: 4000 });
    expect(result.current[0].data).toBeUndefined();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("waits for the Passport session before asking", () => {
    dbAccessToken = undefined;

    render([A]);

    expect(get).not.toHaveBeenCalled();
  });
});
