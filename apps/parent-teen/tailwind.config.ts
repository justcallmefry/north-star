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
          "bg-soft": "#faf5ff",
          card: "#ffffff",
          border: "rgba(147,51,234,0.35)",
          accent: "#9333ea",
          "accent-soft": "#c084fc",
        },
        /* Aligned Connecting Families logo: purple (trunk), lime green (growth), magenta (hearts) */
        brand: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#9333ea",
          600: "#7e22ce",
          700: "#6b21a8",
          800: "#5b21b6",
        },
        /* Logo accents: lime green (leaves), magenta pink (hearts) */
        familyGreen: {
          50: "#f7fee7",
          100: "#ecfccb",
          200: "#d9f99d",
          300: "#bef264",
          400: "#a3e635",
          500: "#84cc16",
          600: "#65a30d",
        },
        familyPink: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
        },
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
