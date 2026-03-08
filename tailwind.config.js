/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./main.jsx",
    "./App.jsx",
    "./TasteScopeLanding.jsx",
    "./LoginPage.jsx",
    "./SignUpPage.jsx",
    "./ForgotPasswordPage.jsx",
  ],
  theme: {
    extend: {
      colors: {
        teal: '#0d6b7a',
      }
    },
  },
  plugins: [],
}
