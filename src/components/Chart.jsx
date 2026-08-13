import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"
import { CHART, baseFont } from "./chartTheme.js"
import "./Chart.css"

// Global defaults applied once — keeps typography consistent everywhere.
Chart.defaults.font.family = CHART.font
Chart.defaults.font.size = 12
Chart.defaults.color = CHART.ticks
Chart.defaults.plugins.tooltip.backgroundColor = "#12233b"
Chart.defaults.plugins.tooltip.titleFont = { ...baseFont, weight: "600" }
Chart.defaults.plugins.tooltip.bodyFont = baseFont
Chart.defaults.plugins.tooltip.padding = 10
Chart.defaults.plugins.tooltip.cornerRadius = 8
Chart.defaults.plugins.tooltip.displayColors = false

// Thin wrapper around a canvas that (re)builds a Chart.js instance whenever
// `config` changes and always destroys it on unmount — mirrors the original
// destroy-then-recreate pattern.
export default function ChartCanvas({ config, height = 260, ariaLabel }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !config) return
    chartRef.current = new Chart(canvasRef.current, {
      ...config,
      options: { responsive: true, maintainAspectRatio: false, ...config.options },
    })
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [config])

  return (
    <div className="chart-box" style={{ height }}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
    </div>
  )
}
