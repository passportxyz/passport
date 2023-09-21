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
        background: "rgb(var(--color-background) / <alpha-value>)",
        "background-1": "rgb(var(--color-background-1) / <alpha-value>)",
        "background-2": "rgb(var(--color-background-2) / <alpha-value>)",
        "background-3": "rgb(var(--color-background-3) / <alpha-value>)",
        "background-4": "rgb(var(--color-background-4) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        "foreground-2": "rgb(var(--color-foreground-2) / <alpha-value>)",
        "foreground-3": "rgb(var(--color-foreground-3) / <alpha-value>)",
        "foreground-4": "rgb(var(--color-foreground-4) / <alpha-value>)",
        "foreground-5": "rgb(var(--color-foreground-5) / <alpha-value>)",
        "foreground-6": "rgb(var(--color-foreground-6) / <alpha-value>)",

        // Text Colors
        // using this naming convention
        // so that e.g. text-color-1 can be used
        //
        // Don't use these for non-text colors
        "color-1": "rgb(var(--color-text-1) / <alpha-value>)",
        "color-2": "rgb(var(--color-text-2) / <alpha-value>)",
        "color-3": "rgb(var(--color-text-3) / <alpha-value>)",
        "color-4": "rgb(var(--color-text-4) / <alpha-value>)",

        // Temporary, to be removed
        accent: "#000",
        "accent-2": "#000",
        "accent-3": "#000",
        muted: "#000",
        "gray-400": "#000",
      },
      minHeight: {
        default: "100vh",
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
      "3xl": ["32px", "1.5em"],
      "4xl": ["36px", "1.5em"],
      "5xl": ["40px", "1.5em"],
    },
    fontFamily: {
      body: ["var(--font-body)"],
      heading: ["var(--font-heading)"],
      alt: ["var(--font-alt)"],
    },
  },
  plugins: [require("@headlessui/tailwindcss")],
};
