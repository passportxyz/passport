module.exports = {
  content: ["./pages/**/*.{ts,tsx}", "./config/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/_app.tsx"],
  options: {
    safelist: ["landingPageBackground"],
  },
  theme: {
    extend: {
      backgroundImage: {
        landingPageBackground: "url('/assets/LandingPageBackground.svg')",
      },
      colors: {
        purple: {
          darkpurple: "#0E0333",
          connectPurple: "#6F3FF5",
          gitcoinpurple: "#6f3ff5",
        },
        blue: {
          darkblue: "#0E0333",
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
