import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        montserrat: ["var(--font-montserrat)", "sans-serif"],
      },
      colors: {
        ns: {
          bg: "#ffffff",
          "bg-soft": "#f0f9fd",
          card: "#ffffff",
          border: "rgba(43,140,190,0.35)",
          accent: "#2b8cbe",
          "accent-soft": "#7eb8d9",
        },
        /* Legacy: brand-* is the original sky-blue palette. Kept so the
           app keeps rendering during the migration to the new tokens
           below. New code should prefer dusk / cream / peach. */
        brand: {
          50: "#f0f9fd",
          100: "#dbeef7",
          200: "#b8dcef",
          300: "#8bc4e4",
          400: "#5aa8d6",
          500: "#2b8cbe",
          600: "#2479a8",
          700: "#1e6b9e",
          800: "#1a5d85",
        },
        /* New brand: dusk blue. Anchored, evening-quiet, premium. */
        dusk: {
          50: "#F1F5F9",
          100: "#DDE8EE",
          200: "#B5CBD9",
          300: "#83A8BD",
          400: "#4F82A0",
          500: "#1F4E73",
          600: "#194161",
          700: "#143452",
          800: "#0F2740",
        },
        /* Cream: warm neutral background — not white, not blue. Reads
           "home" rather than "spa". */
        cream: {
          50: "#FAF6F0",
          100: "#F4ECDF",
          200: "#E9DFCC",
          300: "#D9C9AE",
        },
        /* Peach: warm accent. Use sparingly — small surfaces, not large. */
        peach: {
          300: "#F8C3AB",
          400: "#F2A57E",
          500: "#E07A5F",
          600: "#C5604A",
        },
        /* Logo palette: teal/turquoise and blue-green */
        teal: "#69c9ce",
        "blue-green": "#4ea8c5",
      },
      boxShadow: {
        "ns-card": "0 24px 80px rgba(15,23,42,0.12)",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
