import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        teal: {
          50: "#E5F6F4",
          100: "#CCEDEA",
          200: "#99DCD5",
          300: "#66CBBF",
          400: "#33BAAA",
          500: "#00A896",
          600: "#008678",
          700: "#00655A",
          800: "#00433C",
          900: "#00221E",
        },
      },
      borderRadius: {
        "3xl": "var(--radius)",
        "4xl": "calc(var(--radius) * 1.5)",
        "5xl": "calc(var(--radius) * 2)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui"],
        outfit: ["var(--font-outfit)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
