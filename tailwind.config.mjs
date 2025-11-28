import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      // padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        Pink: {
          DEFAULT: "var(--Pink)",
        },
        Purple: {
          DEFAULT: "var(--Purple)",
        },
        Red: {
          DEFAULT: "hsl(var(--Red))",
        },
        Orange: {
          DEFAULT: "var(--Orange)",
        },
        Yellow: {
          DEFAULT: "var(--Yellow)",
        },
        Green: {
          DEFAULT: "var(--Green)",
        },
        Teal: {
          DEFAULT: "var(--Teal)",
        },
        Sky: {
          DEFAULT: "var(--Sky)",
        },
        Blue: {
          DEFAULT: "var(--Blue)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        blob: "blob 10s infinite",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        orbit: "orbit 20s linear infinite",
        marquee: "marquee 25s linear infinite",
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        float: {
          "0%": { transform: "translateY(-10px)" },
          "50%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(10px)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      minHeight: {
        dynamic_hero: "calc(100vh - 69px - 76.8px)",
        static_sidemenu: "calc(100vh - 69px - 76.8px)",
      },
      maxHeight: {
        static_sidemenu: "calc(100vh - 69px - 76.8px)",
        dynamic_search: "calc(50svh - 124px)",
        dynamic_hscreen: "calc(100dvh - 32px - 2rem)",
      },
      height: {
        dynamic_hscreen: "calc(100dvh - 36px - 2rem)",
      },
    },
    fontFamily: {
      sans: ["Montserrat", ...defaultTheme.fontFamily.sans],
      mono: ["'JetBrains Mono'", ...defaultTheme.fontFamily.mono],
    },
  },
  plugins: [require("tailwindcss-animate")],
};
