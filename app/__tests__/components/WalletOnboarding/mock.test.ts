import { describe, it, expect, afterEach } from "vitest";
import { getOnboardingMock } from "../../../components/WalletOnboarding/mock";

const setHash = (h: string) => {
  window.location.hash = h;
};

describe("getOnboardingMock", () => {
  afterEach(() => setHash(""));

  it("returns null with no mock param", () => {
    setHash("#/wallet-onboarding");
    expect(getOnboardingMock()).toBeNull();
  });

  it("parses mock=nice", () => {
    setHash("#/wallet-onboarding?mock=nice");
    expect(getOnboardingMock()).toBe("nice");
  });

  it("parses mock=boost", () => {
    setHash("#/wallet-onboarding?mock=boost");
    expect(getOnboardingMock()).toBe("boost");
  });

  it("ignores unknown mock values", () => {
    setHash("#/wallet-onboarding?mock=whatever");
    expect(getOnboardingMock()).toBeNull();
  });
});
