import { Theme } from "./types";
import palette from "./palette";

export const LUNARPUNK_DARK_MODE: Theme = {
  colors: {
    background: palette.moon[600],
    background2: palette.moon[800],
    accent: palette.passionflower[500],
    accent2: palette.wave[800],
    accent3: palette.lichen[600],
    muted: palette.passionflower[100],
    text1: palette.white,
    text2: palette.sand[400],
    text3: palette.passionflower[200],
    text4: palette.moon[300],
  },
  fonts: {
    body: "futura-pt",
    heading: "grad",
    alt: "DM Mono",
  },
};
