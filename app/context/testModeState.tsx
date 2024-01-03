// This file provides a minimal import to see whether or not the app is in test mode,
// and a toggle function which reloads the page in the opposite mode.

// This is only set on page load (required to support wallet modal config)
export const TEST_MODE = typeof window !== "undefined" && window.sessionStorage.getItem("testMode") === "on";

export const toggleTestMode = () => {
  if (TEST_MODE) {
    window.sessionStorage.setItem("testMode", "off");
  } else {
    window.sessionStorage.setItem("testMode", "on");
  }
  window.location.reload();
};
