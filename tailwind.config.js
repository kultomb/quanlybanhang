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
        "confirm-modal":
          "0 25px 50px -12px rgb(0 0 0 / 0.25), 0 12px 24px -8px rgb(15 23 42 / 0.12)",
      },
      keyframes: {
        "confirm-backdrop": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "confirm-modal": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "confirm-backdrop": "confirm-backdrop 0.2s ease-out forwards",
        "confirm-modal":
          "confirm-modal 0.24s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};
