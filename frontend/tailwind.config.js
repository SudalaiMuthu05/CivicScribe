/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F5F1",
        surface: "#FFFFFF",
        ink: {
          900: "#16232F",
          700: "#26384A",
          500: "#4B5D6E",
          300: "#8A97A3",
        },
        line: "#DDD8CC",
        accent: {
          DEFAULT: "#2C5A85",
          dark: "#1F4266",
          light: "#EAF1F6",
        },
        success: {
          DEFAULT: "#4C7A5C",
          light: "#EAF2EC",
        },
        warning: {
          DEFAULT: "#A8763A",
          light: "#F7EEE1",
        },
        danger: {
          DEFAULT: "#9C4A3E",
          light: "#F6EAE8",
        },
      },
      fontFamily: {
        serif: ["Source Serif 4", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1160px",
      },
      transitionDuration: {
        150: "150ms",
        200: "200ms",
      },
    },
  },
  plugins: [],
};
