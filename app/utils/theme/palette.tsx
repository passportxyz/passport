export const palette = Object.entries({
  black: "#000000",
  white: "#ffffff",
  gray: "#6d6d6d",
  nightBlue: "#122b33",
  ironGray: "#4b5f65",
  iris: "#4a47d3",
  seaFoam: "#6cB6ad",
  green: "#22645c",
  darkPurple: "#08205f",
  iceBlue: "#c1f6ff",
  turquoise: "#074853",
  paleYellow: "#d2dc95",
  red: "#ff5c00",
}).reduce(
  (rgbPalette, [name, hex]) => {
    rgbPalette[name] = hexToRGB(hex);
    return rgbPalette;
  },
  {} as Record<string, string>
);

export function hexToRGB(hex: string) {
  var r = parseInt(hex.slice(1, 3), 16) || 0,
    g = parseInt(hex.slice(3, 5), 16) || 0,
    b = parseInt(hex.slice(5, 7), 16) || 0;

  return "" + r + " " + g + " " + b;
}

export default palette;
