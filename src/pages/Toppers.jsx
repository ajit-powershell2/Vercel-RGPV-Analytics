import { useState } from "react"
import { Link } from "react-router-dom"
import { getToppers } from "../data/api.js"
import { useAsync } from "../utils/useAsync.js"
import { fmtNum } from "../utils/format.js"
import SectionHeader from "../components/SectionHeader.jsx"
import SemesterFilter from "../components/SemesterFilter.jsx"
import Panel from "../components/Panel.jsx"
import { Skeleton, StateBlock } from "../components/States.jsx"
import "./Toppers.css"

function medalClass(rank) {
  return rank === 1 ? "r1" : rank === 2 ? "r2" : rank === 3 ? "r3" : ""
}

export default function Toppers() {
  const [semester, setSemester] = useState("")
  const { loading, error, data } = useAsync(() => getToppers(semester, 10), [semester])
  const toppers = Array.isArray(data) ? data : []

  return (
    <div className="page">
      <SectionHeader
        eyebrow="Leaderboard"
        title="Toppers"
        subtitle="Ranked by CGPA, among analyzed students."
        action={<SemesterFilter value={semester} onChange={setSemester} id="toppers-sem" />}
      />

      <Panel>
        {loading ? (
          <div className="toppers-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={58} radius="var(--r-md)" />
            ))}
          </div>
        ) : error ? (
          <StateBlock tone="error" title="Couldn't load toppers" message="Please try again shortly." />
        ) : toppers.length === 0 ? (
          <StateBlock title="No results stored yet" message="There are no analyzed results in this scope." />
        ) : (
          <ol className="toppers">
            {toppers.map((t) => {
              const m = medalClass(t.rank)
              return (
                <li key={`${t.enrollment}-${t.rank}`} className={`topper ${m ? `topper--${m}` : ""}`}>
                  <span className={`topper__rank ${m ? `topper__rank--${m}` : ""}`}>
                    {t.rank}
                  </span>
                  <div className="topper__info">
                    <Link to={`/student/${encodeURIComponent(t.enrollment)}`} className="topper__name">
                      {t.name || t.enrollment}
                    </Link>
                    <span className="topper__sub">
                      {t.enrollment} · {t.branch || "—"} · Sem {t.semester || "—"}
                    </span>
                  </div>
                  <span className="topper__cgpa">{fmtNum(t.cgpa)}</span>
                </li>
              )
            })}
          </ol>
        )}
      </Panel>
    </div>
  )
}
