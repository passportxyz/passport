module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./config/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/_app.tsx"],
  theme: {
    screens: {
      md: "480px",
      lg: "1020px",
      xl: "1280px",
    },
    extend: {
      colors: {
        purple: {
          softpurple: "#757087",
          darkpurple: "#0E0333",
          connectPurple: "#6F3FF5",
          gitcoinpurple: "#6f3ff5",
          infoElementBorder: "#D5BDFF",
          infoElementBG: "#F6F0FF",
        },
        yellow: "#FFF8DB",
        blue: {
          darkblue: "#0E0333",
        },
        green: {
          jade: "#02E2AC",
        },
        background: "var(--color-background)",
        "background-2": "var(--color-background-2)",
        accent: "var(--color-accent)",
        "accent-2": "var(--color-accent-2)",
        "accent-3": "var(--color-accent-3)",
        muted: "var(--color-muted)",

        // Text Colors
        // using this naming convention
        // so that e.g. text-color-1 can be used
        //
        // Don't use these for non-text colors
        "color-1": "var(--color-text-1)",
        "color-2": "var(--color-text-2)",
        "color-3": "var(--color-text-3)",
        "color-4": "var(--color-text-4)",
      },
    },
    fontSize: {
      // Set line-height to 150%
      // for all font sizes
      xs: ["12px", "1.5em"],
      sm: ["14px", "1.5em"],
      base: ["16px", "1.5em"],
      lg: ["18px", "1.5em"],
      xl: ["20px", "1.5em"],
      "2xl": ["24px", "1.5em"],
      "3xl": ["30px", "1.5em"],
      "4xl": ["36px", "1.5em"],
      "5xl": ["48px", "1.5em"],
    },
    fontFamily: {
      body: ["var(--font-body)"],
      heading: ["var(--font-heading)"],
      alt: ["var(--font-alt)"],
    },
    minHeight: {
      default: "100vh",
    },
  },
  plugins: [require("@headlessui/tailwindcss")],
};
