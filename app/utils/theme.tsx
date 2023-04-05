export const palette = {
  wave: {
    800: "#083A40",
  },
  sand: {
    400: "#ECE7D5",
  },
  moon: {
    600: "#0B110F",
  },
  passionflower: {
    500: "#6935ff",
    100: "#d9d6ff",
  },
  lichen: {
    600: "#8af214",
  },
  white: "#fff",
};

export type Theme = {
  colors: {
    background: string;
    accent: string;
    "accent-2": string;
    "accent-3": string;
    muted: string;
    "text-1": string;
    "text-2": string;
    "text-3": string;
  };
  fonts: {
    body: string;
    heading: string;
  };
};

export const setTheme = ({ colors, fonts }: Theme) => {
  const r = document.documentElement;

  r.style.setProperty("--color-background", colors.background);
  r.style.setProperty("--color-accent", colors.accent);
  r.style.setProperty("--color-accent-2", colors["accent-2"]);
  r.style.setProperty("--color-accent-3", colors["accent-3"]);
  r.style.setProperty("--color-muted", colors.muted);
  r.style.setProperty("--color-text-1", colors["text-1"]);
  r.style.setProperty("--color-text-2", colors["text-2"]);
  r.style.setProperty("--color-text-3", colors["text-3"]);

  r.style.setProperty("--font-body", fonts.body);
  r.style.setProperty("--font-heading", fonts.heading);
};
