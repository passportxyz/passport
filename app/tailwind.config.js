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
        background: "var(--color-background)",
        "background-2": "var(--color-background-2)",
        "background-3": "var(--color-background-3)",
        foreground: "var(--color-foreground)",
        "foreground-2": "var(--color-foreground-2)",
        "foreground-3": "var(--color-foreground-3)",
        "foreground-4": "var(--color-foreground-4)",
        "foreground-5": "var(--color-foreground-5)",
        "foreground-6": "var(--color-foreground-6)",

        // Text Colors
        // using this naming convention
        // so that e.g. text-color-1 can be used
        //
        // Don't use these for non-text colors
        "color-1": "var(--color-text-1)",
        "color-2": "var(--color-text-2)",
        "color-3": "var(--color-text-3)",
        "color-4": "var(--color-text-4)",

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
    backgroundSize: {
      "size-200": "200% 200%",
    },
    backgroundPosition: {
      "pos-0": "0% 0%",
      "pos-100": "100% 100%",
    },
    boxShadow: {
      background3: "0 0 25px var(--color-background-3)",
    },
  },
  plugins: [require("@headlessui/tailwindcss")],
};
