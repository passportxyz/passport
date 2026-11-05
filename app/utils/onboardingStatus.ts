// Whether this device has already shown onboarding to an address. Onboarding shows on an account's
// first login on a device; after that, logging in with the same address goes straight to the
// dashboard. Another account, or cleared site data, sees it again. Storage can be unavailable (a
// private window, blocked site data): then onboarding just shows again.
const key = (address: string) => `passport-onboarding-seen-${address.toLowerCase()}`;

export const hasSeenOnboarding = (address: string): boolean => {
  try {
    return window.localStorage.getItem(key(address)) === "1";
  } catch {
    return false;
  }
};

export const markOnboardingSeen = (address: string): void => {
  try {
    window.localStorage.setItem(key(address), "1");
  } catch {
    // Nothing to do: onboarding shows again next time.
  }
};
