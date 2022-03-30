const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          final: "#de8250",
        },
      },
    },
  },
  plugins: [],
};
