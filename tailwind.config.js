/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode via .dark class on root element
  content: [
    "./index.html",
    "./main.jsx",
    "./App.jsx",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./data/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: {
          light: "#f8fafc",
          dark: "#071127",
          DEFAULT: "#f8fafc",
        },
        foreground: {
          light: "#1e293b",
          dark: "#e6eef8",
          DEFAULT: "#1e293b",
        },
        card: {
          light: "#ffffff",
          dark: "#0f1724",
          DEFAULT: "#ffffff",
        },
        "card-foreground": {
          light: "#1e293b",
          dark: "#e6eef8",
          DEFAULT: "#1e293b",
        },
        primary: "#3b82f6",
        "primary-foreground": "#ffffff",
        secondary: {
          light: "#e2e8f0",
          dark: "#243249",
          DEFAULT: "#e2e8f0",
        },
        "secondary-foreground": "#334155",
        muted: {
          light: "#f1f5f9",
          dark: "#071827",
          DEFAULT: "#f1f5f9",
        },
        "muted-foreground": {
          light: "#64748b",
          dark: "#94a3b8",
          DEFAULT: "#64748b",
        },
        accent: "#e0e7ff",
        "accent-foreground": "#334155",
        destructive: "#ef4444",
        "destructive-foreground": "#ffffff",
        border: {
          light: "#e2e8f0",
          dark: "#243249",
          DEFAULT: "#e2e8f0",
        },
        input: {
          light: "#e2e8f0",
          dark: "#243249",
          DEFAULT: "#e2e8f0",
        },
        ring: "#3b82f6",
        success: "#22c55e",
        "success-foreground": "#ffffff",
        warning: "#f59e0b",
        "warning-foreground": "#422006",
        sidebar: {
          light: "#ffffff",
          dark: "#0a1117",
          DEFAULT: "#ffffff",
        },
        "sidebar-foreground": {
          light: "#1e293b",
          dark: "#e6eef8",
          DEFAULT: "#1e293b",
        },
        "sidebar-primary": "#3b82f6",
        "sidebar-primary-foreground": "#ffffff",
        "sidebar-accent": {
          light: "#f1f5f9",
          dark: "#071827",
          DEFAULT: "#f1f5f9",
        },
        "sidebar-accent-foreground": "#334155",
        "sidebar-border": {
          light: "#e2e8f0",
          dark: "#243249",
          DEFAULT: "#e2e8f0",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [
    function ({ addBase, theme }) {
      addBase({
        ':root': {
          '--background-light': '#f8fafc',
          '--background-dark': '#071127',
          '--foreground-light': '#1e293b',
          '--foreground-dark': '#e6eef8',
          '--card-light': '#ffffff',
          '--card-dark': '#0f1724',
          '--border-light': '#e2e8f0',
          '--border-dark': '#243249',
          '--muted-light': '#f1f5f9',
          '--muted-dark': '#071827',
        },
        'html.dark': {
          '--background': 'var(--background-dark)',
          '--foreground': 'var(--foreground-dark)',
          '--card': 'var(--card-dark)',
          '--border': 'var(--border-dark)',
          '--muted': 'var(--muted-dark)',
        },
        'html': {
          '--background': 'var(--background-light)',
          '--foreground': 'var(--foreground-light)',
          '--card': 'var(--card-light)',
          '--border': 'var(--border-light)',
          '--muted': 'var(--muted-light)',
        },
      });
    },
  ],
}
