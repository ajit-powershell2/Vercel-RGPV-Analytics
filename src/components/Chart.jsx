import { useEffect, useRef, useState } from "react"
import Chart from "chart.js/auto"
import { CHART, baseFont } from "./chartTheme.js"
import "./Chart.css"

// Applies typography + palette defaults from the live theme. Re-run on every
// build so a light/dark switch is reflected in tick/legend/tooltip colors.
function applyThemeDefaults() {
  Chart.defaults.font.family = CHART.font
  Chart.defaults.font.size = 12
  Chart.defaults.color = CHART.ticks
  Chart.defaults.plugins.tooltip.backgroundColor = CHART.navy
  Chart.defaults.plugins.tooltip.titleFont = { ...baseFont, weight: "600" }
  Chart.defaults.plugins.tooltip.bodyFont = baseFont
  Chart.defaults.plugins.tooltip.padding = 10
  Chart.defaults.plugins.tooltip.cornerRadius = 8
  Chart.defaults.plugins.tooltip.displayColors = false
}

// Watches for the theme switching on <html data-theme> and returns a counter
// that changes so charts rebuild with the new palette.
function useThemeVersion() {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })
    return () => observer.disconnect()
  }, [])
  return version
}

// Re-resolves any theme-dependent colors (grid lines, tick + legend text)
// against the live CSS variables so a rebuilt chart matches the active theme.
// Dataset fills stay as authored by each page.
function withThemedScales(config) {
  const ticks = CHART.ticks
  const grid = CHART.grid
  const options = { ...(config.options || {}) }

  if (options.scales) {
    const scales = {}
    for (const [key, scale] of Object.entries(options.scales)) {
      const next = { ...scale }
      if (next.ticks) next.ticks = { ...next.ticks, color: ticks }
      if (next.grid && next.grid.display !== false) {
        next.grid = { ...next.grid, color: grid }
      }
      scales[key] = next
    }
    options.scales = scales
  }

  const legend = options.plugins?.legend
  if (legend && legend.labels) {
    options.plugins = {
      ...options.plugins,
      legend: { ...legend, labels: { ...legend.labels, color: ticks } },
    }
  }

  return { ...config, options }
}

// Thin wrapper around a canvas that (re)builds a Chart.js instance whenever
// `config` OR the active theme changes, and always destroys it on unmount.
export default function ChartCanvas({ config, height = 260, ariaLabel }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const themeVersion = useThemeVersion()

  useEffect(() => {
    if (!canvasRef.current || !config) return
    applyThemeDefaults()
    const themed = withThemedScales(config)
    chartRef.current = new Chart(canvasRef.current, {
      ...themed,
      options: { responsive: true, maintainAspectRatio: false, ...themed.options },
    })
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [config, themeVersion])

  return (
    <div className="chart-box" style={{ height }}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
    </div>
  )
}
