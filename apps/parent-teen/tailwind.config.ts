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
        /* Blue accent scale (500 = #2b8cbe) */
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
