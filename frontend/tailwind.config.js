/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary-container": "#0c322c",
        "primary": "#001c18",
        "primary-fixed-dim": "#a8cec5",
        "secondary": "#4f57a8",
        "on-secondary-fixed-variant": "#373e8e",
        "on-secondary": "#ffffff",
        "tertiary-container": "#00341d",
        "on-tertiary-container": "#0ea969",
        "tertiary-fixed": "#7afbb2",
        "on-tertiary-fixed": "#002110",
        "background": "#efefef",
        "surface": "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f8f9fa",
        "surface-container": "#f1f3f4",
        "surface-container-high": "#e8eaed",
        "surface-container-highest": "#dfe2e6",
        "on-surface": "#0c322c",
        "on-surface-variant": "#4d5956",
        "outline": "#717976",
        "outline-variant": "#cdd3d1",
        pine: {
          DEFAULT: "#0c322c",
          dark: "#061a17",
          light: "#17483f"
        },
        jungle: {
          DEFAULT: "#30ba78",
          dark: "#228a57",
          light: "#e8f8f0",
          container: "#daf4e6",
          "on-container": "#005230"
        },
        midnight: {
          DEFAULT: "#192072",
          dark: "#10154e",
          light: "#edf0ff",
          container: "#dde5ff"
        },
        waterhole: {
          DEFAULT: "#2453ff",
          dark: "#163ecc",
          light: "#eff2ff",
          container: "#dde5ff"
        },
        error: {
          DEFAULT: "#ba1a1a",
          container: "#ffdad6",
          "on-container": "#93000a"
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        headline: ["Plus Jakarta Sans", "Manrope", "sans-serif"]
      }
    },
  },
  plugins: [],
};

