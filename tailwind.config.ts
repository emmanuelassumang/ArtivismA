import type { Config } from "tailwindcss";

export default {
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
        "card-bg": "var(--card-bg)",
        "card-hover": "var(--card-hover)",
        "nav-bg": "var(--nav-bg)",
        "input-bg": "var(--input-bg)",
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        "primary-light": "var(--primary-light)",
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
        '100': '25rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
