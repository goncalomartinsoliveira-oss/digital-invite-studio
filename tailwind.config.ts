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
        // Estas são as variáveis que configuraste no layout
        serif: ["var(--font-cormorant)"],
        sans: ["var(--font-inter)"],
        // Esta é a fonte cursiva para nomes e detalhes
        script: ["var(--font-pinyon)", "cursive"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;