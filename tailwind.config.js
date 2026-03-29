/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 16px -2px rgb(15 23 42 / 0.08)",
        "card-hover": "0 4px 24px -4px rgb(15 23 42 / 0.12)",
      },
    },
  },
  plugins: [],
};
