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
        montserrat: ["var(--font-montserrat)", "sans-serif"],
      },
      colors: {
        ns: {
          bg: "#020617",
          "bg-soft": "#020617",
          card: "rgba(15,23,42,0.85)",
          border: "rgba(148,163,184,0.35)",
          accent: "#4f46e5",
          "accent-soft": "#6366f1",
        },
      },
      boxShadow: {
        "ns-card": "0 24px 80px rgba(15,23,42,0.9)",
      },
      backdropBlur: {
        xs: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
