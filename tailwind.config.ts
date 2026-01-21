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
        // Nouveau Elevator brand colors - can be customized
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Status colors for jobs/change orders
        status: {
          draft: "#6b7280",
          pending: "#f59e0b",
          "in-progress": "#3b82f6",
          "under-review": "#8b5cf6",
          approved: "#10b981",
          rejected: "#ef4444",
          completed: "#059669",
          cancelled: "#9ca3af",
        },
      },
    },
  },
  plugins: [],
};
export default config;
