import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          bg: "#EBF1F6",
          card: "#F4F7FB",
          surface: "#F8FAFC",
          primary: "#4F6EF7",
          primaryLight: "#738EFA",
          income: "#10B981",
          incomeLight: "#34D399",
          expense: "#F43F5E",
          expenseLight: "#FB7185",
          transfer: "#8B5CF6",
          transferLight: "#A78BFA",
          warning: "#F59E0B",
          warningLight: "#FBBF24",
          dark: "#1E293B",
          muted: "#64748B",
        },
      },
      boxShadow: {
        clay: "8px 8px 16px #c5d3e0, -8px -8px 16px #ffffff, inset 2px 2px 4px rgba(255,255,255,0.7), inset -2px -2px 4px rgba(160,180,200,0.25)",
        "clay-sm": "4px 4px 10px #c5d3e0, -4px -4px 10px #ffffff, inset 1px 1px 3px rgba(255,255,255,0.8), inset -1px -1px 3px rgba(160,180,200,0.2)",
        "clay-lg": "12px 12px 24px #c2d1e0, -12px -12px 24px #ffffff, inset 3px 3px 6px rgba(255,255,255,0.9), inset -3px -3px 6px rgba(160,180,200,0.3)",
        "clay-pressed": "inset 4px 4px 8px #c5d3e0, inset -4px -4px 8px #ffffff",
        "clay-primary": "6px 6px 14px rgba(79,110,247,0.35), -4px -4px 10px #ffffff, inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 5px rgba(20,50,180,0.3)",
        "clay-income": "6px 6px 14px rgba(16,185,129,0.35), -4px -4px 10px #ffffff, inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 5px rgba(5,120,80,0.3)",
        "clay-expense": "6px 6px 14px rgba(244,63,94,0.35), -4px -4px 10px #ffffff, inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 5px rgba(180,20,50,0.3)",
        "clay-warning": "6px 6px 14px rgba(245,158,11,0.35), -4px -4px 10px #ffffff, inset 2px 2px 4px rgba(255,255,255,0.6), inset -2px -2px 5px rgba(160,100,5,0.3)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
