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
        // Estas são as variáveis que vamos configurar no layout
        serif: ["var(--font-cormorant)"],
        sans: ["var(--font-inter)"],
      },
    },
  },
  plugins: [],
};
export default config;