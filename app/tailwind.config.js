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
      miriamlibre: ["miriam libre"],
      librefranklin: ["Libre Franklin"],
      body: ['"Libre Franklin"'],
    },
    minHeight: {
      default: "100vh",
    },
  },
  plugins: [],
};
