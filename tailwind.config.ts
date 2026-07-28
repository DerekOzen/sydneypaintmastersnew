import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Teal / green brand accent
        teal: {
          DEFAULT: "#14a79a",
          50: "#eef8f6",
          100: "#d3ede9",
          200: "#a9dcd5",
          300: "#72c6bc",
          400: "#3fb0a4",
          500: "#14a79a",
          600: "#0f8b80",
          700: "#0e7168",
          800: "#0f5a54",
          900: "#104a46",
        },
        // Deep navy for headings / dark text
        navy: {
          DEFAULT: "#16294d",
          700: "#1d3a63",
          800: "#16294d",
          900: "#0f1e3a",
        },
        // Secondary blue used in some CTAs
        ocean: {
          DEFAULT: "#1f7ec4",
          600: "#1f7ec4",
          700: "#1a6aa6",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
