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
          "bg-soft": "#fdf2f8",
          card: "#ffffff",
          border: "rgba(244,114,182,0.35)",
          accent: "#ec4899",
          "accent-soft": "#f472b6",
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
