import { Theme } from "./types";

const setTheme = ({ colors, fonts }: Theme) => {
  const r = document.documentElement;

  r.style.setProperty("--color-background", colors.background);
  r.style.setProperty("--color-background-2", colors.background2);
  r.style.setProperty("--color-accent", colors.accent);
  r.style.setProperty("--color-accent-2", colors.accent2);
  r.style.setProperty("--color-accent-3", colors.accent3);
  r.style.setProperty("--color-muted", colors.muted);
  r.style.setProperty("--color-text-1", colors.text1);
  r.style.setProperty("--color-text-2", colors.text2);
  r.style.setProperty("--color-text-3", colors.text3);
  r.style.setProperty("--color-text-4", colors.text4);

  r.style.setProperty("--font-body", fonts.body);
  r.style.setProperty("--font-heading", fonts.heading);
};

export default setTheme;
