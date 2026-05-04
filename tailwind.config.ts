// tailwind.config.ts
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
        // ADICIONADO: Esta é a linha que faltava!
        script: ["var(--font-pinyon)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;