import type { Config } from "tailwindcss";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        mist: "#f6f7f2",
        sage: "#63756b",
        copper: "#b8683b"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 32, 38, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;

export default config;
