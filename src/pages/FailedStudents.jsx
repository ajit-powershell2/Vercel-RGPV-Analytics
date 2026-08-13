import { useState } from "react"
import { Link } from "react-router-dom"
import { getTopFailers } from "../data/api.js"
import { useAsync } from "../utils/useAsync.js"
import SectionHeader from "../components/SectionHeader.jsx"
import SemesterFilter from "../components/SemesterFilter.jsx"
import Panel from "../components/Panel.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import { Skeleton, StateBlock } from "../components/States.jsx"
import "./FailedStudents.css"

// The backers list stores a count of failed/back subjects. We read the most
// likely field names without inventing new meaning, so the page renders
// regardless of the exact key the analytics service returns.
function backlogCount(f) {
  const v =
    f.failed_count ??
    f.backlogs ??
    f.total_failed ??
    f.failed_subjects ??
    f.back_subjects
  return v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v)
}

export default function FailedStudents() {
  const [semester, setSemester] = useState("")
  const { loading, error, data } = useAsync(() => getTopFailers(semester, 50), [semester])
  const failers = Array.isArray(data) ? data : []

  return (
    <div className="page">
      <SectionHeader
        eyebrow="At risk"
        title="Failed Students"
        subtitle="Analyzed students carrying one or more failed subjects, most backlogs first."
        action={<SemesterFilter value={semester} onChange={setSemester} id="failed-sem" />}
      />

      <Panel>
        {loading ? (
          <div className="failed-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={58} radius="var(--r-md)" />
            ))}
          </div>
        ) : error ? (
          <StateBlock tone="error" title="Couldn't load failed students" message="Please try again shortly." />
        ) : failers.length === 0 ? (
          <StateBlock title="No failed results stored" message="There are no analyzed students with backlogs in this scope." />
        ) : (
          <ul className="failed">
            {failers.map((f, i) => {
              const count = backlogCount(f)
              return (
                <li key={`${f.enrollment}-${i}`} className="failed__row">
                  <span className="failed__index">{i + 1}</span>
                  <div className="failed__info">
                    <Link to={`/student/${encodeURIComponent(f.enrollment)}`} className="failed__name">
                      {f.name || f.enrollment}
                    </Link>
                    <span className="failed__sub">
                      {f.enrollment} · {f.branch || "—"} · Sem {f.semester ?? "—"}
                    </span>
                  </div>
                  {count != null && (
                    <StatusBadge tone="fail">
                      {count} {count === 1 ? "backlog" : "backlogs"}
                    </StatusBadge>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <p className="disclaimer failed__caveat">
        Reflects analyzed / scraped enrollments only, not the full official RGPV student body.
      </p>
    </div>
  )
}
