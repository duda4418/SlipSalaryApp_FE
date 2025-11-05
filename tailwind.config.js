/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Endava uses Inter font
      },
      colors: {
        border: "var(--color-border)",
        input: "var(--color-border)",
        ring: "var(--color-primary)",
        background: "var(--color-surface)",
        foreground: "var(--neutral-900)",
        primary: {
          DEFAULT: "#FF3366",
          50: "#FFF0F4",
          100: "#FFE1E9",
          200: "#FFB3C7",
          300: "#FF85A5",
          400: "#FF5784",
          500: "#FF3366",
          600: "#FF1F55",
          700: "#E61E4D",
          800: "#CC1B44",
          900: "#B3183B",
        },
        accent: {
          DEFAULT: "#1A1A1A",
          50: "#F5F5F5",
          100: "#E6E6E6",
          200: "#CCCCCC",
          300: "#B3B3B3",
          400: "#999999",
          500: "#808080",
          600: "#666666",
          700: "#4D4D4D",
          800: "#333333",
          900: "#1A1A1A",
        },
        muted: "var(--color-muted)",
        success: {
          DEFAULT: "#00B67A",
          600: "#00A36F",
        },
        warning: {
          DEFAULT: "#FFB74D",
          600: "#FFA726",
        },
        danger: {
          DEFAULT: "#FF3366",
          600: "#FF1F55",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      spacing: {
        xs: "var(--gap-xs)",
        sm: "var(--gap-sm)",
        md: "var(--gap-md)",
        lg: "var(--gap-lg)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}