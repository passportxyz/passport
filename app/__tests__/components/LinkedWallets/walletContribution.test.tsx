import { vi, describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("../../../hooks/usePlatforms", () => ({
  usePlatforms: () => ({
    platformProviders: {
      Google: [{ name: "Google", title: "Google account" }],
      Github: [{ name: "GithubContributionActivityGte#30", title: "30+ contribution days" }],
    },
    getPlatformSpec: (platformId: string) =>
      ({
        Google: { name: "Google", icon: "./assets/googleStampIcon.svg" },
        Github: { name: "GitHub", icon: "./assets/githubStampIcon.svg" },
      })[platformId],
  }),
}));

import { useWalletContribution } from "../../../components/LinkedWallets/walletContribution";

const contributionFor = () => renderHook(() => useWalletContribution()).result.current;

describe("useWalletContribution", () => {
  // The wallet details screen: stamps with their points, credentials with their expiry.
  it("describes the stamps that count with Passport's names", () => {
    const contribution = contributionFor()([
      { provider: "Google", points: "0.5", expires: "2026-12-04T10:00:00Z" },
      { provider: "GithubContributionActivityGte#30", points: "1.2", expires: null },
    ]);

    expect(contribution.stamps.map(({ id, name, points }) => ({ id, name, points }))).toEqual([
      { id: "Google", name: "Google", points: "0.5" },
      { id: "GithubContributionActivityGte#30", name: "GitHub", points: "1.2" },
    ]);
    expect(contribution.credentials.map(({ id, name, detail }) => ({ id, name, detail }))).toEqual([
      { id: "Google", name: "Google account", detail: "Google · Expires 4 Dec 2026" },
      { id: "GithubContributionActivityGte#30", name: "30+ contribution days", detail: "GitHub" },
    ]);
    expect(contribution.stamps[0].icon).toBeTruthy();
  });

  it("falls back to the provider id for a stamp Passport doesn't know", () => {
    const contribution = contributionFor()([{ provider: "NewProvider", points: "2", expires: null }]);

    expect(contribution.stamps[0]).toEqual(expect.objectContaining({ name: "NewProvider", icon: undefined }));
    expect(contribution.credentials[0]).toEqual(
      expect.objectContaining({ name: "NewProvider", detail: "NewProvider" })
    );
  });

  it("is empty while the score hasn't loaded or nothing counts", () => {
    expect(contributionFor()(undefined)).toEqual({ stamps: [], credentials: [] });
    expect(contributionFor()([])).toEqual({ stamps: [], credentials: [] });
  });
});
