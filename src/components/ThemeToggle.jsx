import { useEffect, useState } from "react"
import "./ThemeToggle.css"

const STORAGE_KEY = "rgpv-theme"

// Read the persisted theme (light default). Runs before first paint via the
// inline script in index.html, but we mirror it in React state for the icon.
function getInitialTheme() {
  if (typeof window === "undefined") return "light"
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved === "dark" ? "dark" : "light"
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
    // Keep the browser chrome (mobile address bar) in sync with the theme.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0f172a" : "#12233b")
  }, [theme])

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        // Sun — shown in dark mode (click to go light)
        <svg
          className="theme-toggle__icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon — shown in light mode (click to go dark)
        <svg
          className="theme-toggle__icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
