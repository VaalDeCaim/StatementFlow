const { heroui } = require("@heroui/theme/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0)", opacity: "0.4" },
          "33%": { transform: "translate(6px, -8px)", opacity: "0.7" },
          "66%": { transform: "translate(-4px, 4px)", opacity: "0.5" },
        },
        "coin-fall": {
          "0%": { transform: "translateY(-12px)", opacity: "0" },
          "20%": { opacity: "0.8" },
          "100%": { transform: "translateY(18px)", opacity: "0" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "coin-fall": "coin-fall 4s linear infinite",
      },
    },
  },
  plugins: [
    heroui({
      layout: {
        radius: "lg",
      },
    }),
  ],
};
