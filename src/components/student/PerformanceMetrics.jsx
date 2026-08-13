import Panel from "../Panel.jsx"
import { fmtNum } from "../../utils/format.js"
import "./PerformanceMetrics.css"

function rankLine(rank, total) {
  return total ? `#${rank ?? "—"} / ${total}` : "—"
}

export default function PerformanceMetrics({ active }) {
  const metrics = [
    { label: "CGPA", value: fmtNum(active.cgpa), primary: true },
    {
      label: "Branch Rank",
      value: rankLine(active.branch_rank, active.branch_total),
      note: "analyzed",
      compact: true,
    },
    {
      label: "College Rank",
      value: rankLine(active.college_rank, active.college_total),
      note: "analyzed",
      compact: true,
    },
    {
      label: "Percentile",
      value: active.percentile != null ? `${active.percentile}%` : "—",
    },
  ]

  return (
    <Panel>
      <h2 className="perf__heading">Your performance</h2>
      <div className="perf__grid">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`perf__metric${m.primary ? " perf__metric--primary" : ""}`}
          >
            <span className={`perf__value${m.compact ? " perf__value--compact" : ""}`}>
              {m.value}
            </span>
            <span className="perf__label">
              {m.label}
              {m.note ? <span className="perf__note"> ({m.note})</span> : null}
            </span>
          </div>
        ))}
      </div>

      {active.percentile != null && (
        <p className="perf__callout">
          You performed better than <strong>{active.percentile}%</strong> of
          analyzed students.
        </p>
      )}
      <p className="perf__caveat">
        Ranks and percentile are calculated among students analyzed on this
        platform, not an official RGPV merit list.
      </p>
    </Panel>
  )
}
