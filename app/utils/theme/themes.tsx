import { Theme } from "./types";
import palette from "./palette";

export const LUNARPUNK_DARK_MODE: Theme = {
  colors: {
    background: palette.black,
    background2: palette.darkPurple,
    background3: palette.iris,
    background4: palette.nightBlue,
    foreground: palette.white,
    foreground2: palette.iceBlue,
    foreground3: palette.ironGray,
    foreground4: palette.seaFoam,
    foreground5: palette.green,
    foreground6: palette.turquoise,
    text1: palette.white,
    text2: palette.seaFoam,
    text3: palette.nightBlue,
    text4: palette.black,
  },
  fonts: {
    body: "futura-pt",
    heading: "futura-pt",
    alt: "DM Mono",
  },
};
