// Shared Chart.js palette + defaults so every chart reads as one system.
// Colors are resolved from the live CSS custom properties so charts follow
// the active light/dark theme. Read them lazily (per chart build) so a theme
// switch picks up the new values when charts are rebuilt.
function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export const CHART = {
  get navy() {
    return cssVar("--heading", "#12233b")
  },
  get accent() {
    return cssVar("--accent", "#bf6f3a")
  },
  get pass() {
    return cssVar("--pass", "#2f7d5b")
  },
  get fail() {
    return cssVar("--fail", "#b0413f")
  },
  get grid() {
    return cssVar("--line", "#dde3ec")
  },
  get ticks() {
    return cssVar("--muted", "#5d6a7c")
  },
  get font() {
    return cssVar("--font-sans", 'Arial, "Helvetica Neue", Helvetica, sans-serif')
  },
}

export const baseFont = { family: CHART.font, size: 12 }

export const legendBottom = {
  position: "bottom",
  labels: {
    boxWidth: 9,
    boxHeight: 9,
    usePointStyle: true,
    pointStyle: "circle",
    padding: 16,
    color: CHART.ticks,
    font: baseFont,
  },
}

export function gridScale({ max, percent } = {}) {
  return {
    grid: { color: CHART.grid, drawBorder: false },
    border: { display: false },
    ticks: {
      color: CHART.ticks,
      font: baseFont,
      precision: 0,
      ...(percent ? { callback: (v) => `${v}%` } : {}),
    },
    ...(max != null ? { min: 0, max } : { beginAtZero: true }),
  }
}

export function categoryScale() {
  return {
    grid: { display: false },
    border: { display: false },
    ticks: { color: CHART.ticks, font: baseFont },
  }
}
