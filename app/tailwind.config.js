module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./config/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/_app.tsx"],
  theme: {
    extend: {
      colors: {
        purple: {
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
