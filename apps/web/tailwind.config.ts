import type { Config } from "tailwindcss";

// Deliberately neutral palette. Party colors are used ONLY as small, equal-weight
// labels — never to theme a page or give one candidate more visual prominence.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a1a",
        parchment: "#faf7f0",
        well: "#2b4c6f", // Mímir brand — a calm, neutral blue
      },
    },
  },
  plugins: [],
};

export default config;
