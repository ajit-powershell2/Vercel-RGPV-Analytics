// Shared Chart.js palette + defaults so every chart reads as one system.
export const CHART = {
  navy: "#12233b",
  accent: "#bf6f3a",
  pass: "#2f7d5b",
  fail: "#b0413f",
  grid: "#dde3ec",
  ticks: "#5d6a7c",
  font: '"Inter", system-ui, sans-serif',
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
