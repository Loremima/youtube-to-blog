import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ef4444",
          dark: "#b91c1c",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
