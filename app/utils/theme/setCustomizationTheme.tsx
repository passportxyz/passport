import { hexToRGB } from "./palette";
import { CustomizationTheme } from "./types";

export const setCustomizationTheme = ({ colors }: CustomizationTheme) => {
  const r = document.documentElement;

  // We can do this for every sort of tailwind class and CSS prop,
  // for example if we need a dynamic caption size we can do...
  // (note: this is untested and just an example, but it should work)
  // r.style.setProperty("--font-customization-caption-size", font.customizationCaptionSize);
  // we'd set it to something like 1.5rem or 24px
  // and then in tailwind config...
  // fontSize: { "customization-caption-size": "var(--font-customization-caption-size)" }
  // and then we can use it in our components...
  // <p className="text-customization-caption-size">Hello world</p>

  r.style.setProperty("--color-customization-background-1", convertHexToRGB(colors.customizationBackground1));
  r.style.setProperty("--color-customization-background-2", convertHexToRGB(colors.customizationBackground2));
  r.style.setProperty("--color-customization-foreground-1", convertHexToRGB(colors.customizationForeground1));
};

const convertHexToRGB = (color: string) => {
  if (color.startsWith("#")) {
    return hexToRGB(color);
  }
  return color;
};
