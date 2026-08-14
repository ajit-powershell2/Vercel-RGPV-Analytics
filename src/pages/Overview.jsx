import { useNavigate } from "react-router-dom"
import { getSummary } from "../data/api.js"
import { useAsync } from "../utils/useAsync.js"
import { fmtNum, fmtPercent } from "../utils/format.js"
import SearchBar from "../components/SearchBar.jsx"
import StatGrid from "../components/StatGrid.jsx"
import StatCard from "../components/StatCard.jsx"
import Panel, { PanelHeader } from "../components/Panel.jsx"
import ChartCanvas from "../components/Chart.jsx"
import { SkeletonGrid, StateBlock } from "../components/States.jsx"
import { CHART, legendBottom } from "../components/chartTheme.js"
import "./Overview.css"

export default function Overview() {
  const navigate = useNavigate()
  const { loading, error, data: summary } = useAsync(() => getSummary(), [])

  const goToStudent = (enrollment) => {
    navigate(`/student/${encodeURIComponent(enrollment)}`)
  }

  const donutConfig =
    summary && summary.total_students
      ? {
          type: "doughnut",
          data: {
            labels: ["Passed", "Failed"],
            datasets: [
              {
                data: [summary.passed, summary.failed],
                backgroundColor: [CHART.accent, CHART.fail],
                borderWidth: 0,
                hoverOffset: 4,
              },
            ],
          },
          options: { cutout: "72%", plugins: { legend: legendBottom } },
        }
      : null

  return (
    <div className="page stack-8">
      {/* ---- Hero / primary action ---- */}
      <section className="hero" aria-labelledby="hero-title">
        <span className="eyebrow">RGPV Semester Results</span>
        <h1 id="hero-title" className="hero__title">
          Check your RGPV result
        </h1>
        <p className="hero__lead">
          Enter your enrollment number to view your semester result, ranks and
          performance profile.
        </p>
        <div className="hero__search">
          <SearchBar onSubmit={goToStudent} />
        </div>
      </section>

      {/* ---- Platform statistics ---- */}
      <section aria-labelledby="stats-title">
        <div className="overview__section-head">
          <h2 id="stats-title" className="overview__section-title">
            What&apos;s happening in the results
          </h2>
          <p className="overview__section-sub">
            Aggregated from every result currently stored.
          </p>
        </div>

        {loading ? (
          <SkeletonGrid count={4} />
        ) : error ? (
          <Panel>
            <StateBlock
              tone="error"
              title="Couldn't load platform stats"
              message="The analytics service is unreachable right now. Please try again shortly."
            />
          </Panel>
        ) : (
          <div className="stack-6">
            <StatGrid columns={4}>
              <StatCard label="Total Students" value={summary.total_students ?? "—"} />
              <StatCard label="Passed" value={summary.passed ?? "—"} tone="pass" />
              <StatCard label="Failed" value={summary.failed ?? "—"} tone="fail" />
              <StatCard
                label="Pass Rate"
                value={fmtPercent(summary.pass_percent)}
                tone="accent"
              />
            </StatGrid>

            <div className="overview__split">
              <Panel className="overview__donut-panel">
                <PanelHeader
                  title="Pass rate"
                  subtitle="Share of analyzed results that passed."
                />
                {donutConfig ? (
                  <ChartCanvas
                    config={donutConfig}
                    height={240}
                    ariaLabel="Pass versus fail distribution"
                  />
                ) : (
                  <div className="chart-empty">Not enough data yet.</div>
                )}
              </Panel>

              <StatGrid columns={3}>
                <StatCard label="Average CGPA" value={fmtNum(summary.average_cgpa)} />
                <StatCard label="Highest CGPA" value={fmtNum(summary.highest_cgpa)} />
                <StatCard
                  label="Subjects Tracked"
                  value={summary.total_subjects_tracked ?? "—"}
                />
              </StatGrid>
            </div>

            <p className="disclaimer overview__caveat">
              Data reflects analyzed enrollments, not the full official
              RGPV student body.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
