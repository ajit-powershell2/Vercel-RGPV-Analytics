import { useMemo, useState } from "react"
import { getSubjectPassRates, getBranchComparison, getCgpaDistribution } from "../data/api.js"
import { useAsync } from "../utils/useAsync.js"
import SectionHeader from "../components/SectionHeader.jsx"
import SemesterFilter from "../components/SemesterFilter.jsx"
import Panel, { PanelHeader } from "../components/Panel.jsx"
import ChartCanvas from "../components/Chart.jsx"
import { Skeleton, StateBlock } from "../components/States.jsx"
import { CHART, gridScale, categoryScale } from "../components/chartTheme.js"
import "./Analytics.css"

// --- Defensive field access -------------------------------------------------
// The analytics service returns aggregated rows; we read the most likely field
// names without renaming or inventing meaning, so charts render regardless of
// the exact key casing the backend emits.
const num = (v) => (v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v))

const subjectLabel = (r) => r.subject_name || r.subject_code || r.subject || r.name || "—"
const subjectRate = (r) => num(r.pass_percent ?? r.pass_rate ?? r.passPercent ?? r.rate)

const branchLabel = (r) => r.branch || r.name || "—"
const branchRate = (r) => num(r.pass_percent ?? r.pass_rate ?? r.passPercent)
const branchCgpa = (r) => num(r.average_cgpa ?? r.avg_cgpa ?? r.cgpa)

const bucketLabel = (r) => r.range ?? r.bucket ?? r.label ?? r.cgpa_range ?? "—"
const bucketCount = (r) => num(r.count ?? r.students ?? r.total ?? r.value)

// Small helper to render loading / error / empty / chart consistently.
function ChartState({ loading, error, empty, height = 260, children }) {
  if (loading) return <Skeleton height={height} radius="var(--r-md)" />
  if (error)
    return <StateBlock tone="error" title="Couldn't load this chart" message="Please try again shortly." />
  if (empty) return <div className="chart-empty">Not enough data yet.</div>
  return children
}

const SUBJECT_TYPES = ["Theory", "Practical"]

export default function Analytics() {
  const [semester, setSemester] = useState("")
  const [subjectType, setSubjectType] = useState("Theory")

  const passRates = useAsync(() => getSubjectPassRates(semester, subjectType), [semester, subjectType])
  const branches = useAsync(() => getBranchComparison(semester), [semester])
  const distribution = useAsync(() => getCgpaDistribution(semester), [semester])

  const passRateRows = Array.isArray(passRates.data) ? passRates.data : []
  const branchRows = Array.isArray(branches.data) ? branches.data : []
  const distRows = Array.isArray(distribution.data) ? distribution.data : []

  const passRateConfig = useMemo(() => {
    if (passRateRows.length === 0) return null
    const rows = passRateRows.slice(0, 12)
    return {
      type: "bar",
      data: {
        labels: rows.map(subjectLabel),
        datasets: [
          {
            label: "Pass rate",
            data: rows.map(subjectRate),
            backgroundColor: CHART.accent,
            borderRadius: 6,
            maxBarThickness: 30,
          },
        ],
      },
      options: {
        indexAxis: "y",
        scales: { x: { ...gridScale({ max: 100, percent: true }) }, y: { ...categoryScale() } },
        plugins: { legend: { display: false } },
      },
    }
  }, [passRateRows])

  const branchConfig = useMemo(() => {
    if (branchRows.length === 0) return null
    return {
      type: "bar",
      data: {
        labels: branchRows.map(branchLabel),
        datasets: [
          {
            label: "Pass rate",
            data: branchRows.map(branchRate),
            backgroundColor: CHART.pass,
            borderRadius: 6,
            maxBarThickness: 42,
          },
        ],
      },
      options: {
        scales: { y: { ...gridScale({ max: 100, percent: true }) }, x: { ...categoryScale() } },
        plugins: { legend: { display: false } },
      },
    }
  }, [branchRows])

  const distConfig = useMemo(() => {
    if (distRows.length === 0) return null
    return {
      type: "bar",
      data: {
        labels: distRows.map(bucketLabel),
        datasets: [
          {
            label: "Students",
            data: distRows.map(bucketCount),
            backgroundColor: CHART.navy,
            borderRadius: 6,
            maxBarThickness: 46,
          },
        ],
      },
      options: {
        scales: { y: { ...gridScale() }, x: { ...categoryScale() } },
        plugins: { legend: { display: false } },
      },
    }
  }, [distRows])

  return (
    <div className="page stack-6">
      <SectionHeader
        eyebrow="Insights"
        title="Analytics"
        subtitle="Aggregated performance across analyzed results."
        action={<SemesterFilter value={semester} onChange={setSemester} id="analytics-sem" />}
      />

      <Panel>
        <PanelHeader
          title="Subject pass rates"
          subtitle="Share of students who cleared each subject."
          action={
            <div className="seg" role="tablist" aria-label="Subject type">
              {SUBJECT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={subjectType === t}
                  className={`seg__btn${subjectType === t ? " seg__btn--active" : ""}`}
                  onClick={() => setSubjectType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
        <ChartState
          loading={passRates.loading}
          error={passRates.error}
          empty={!passRateConfig}
          height={Math.max(260, passRateRows.slice(0, 12).length * 30)}
        >
          {passRateConfig && (
            <ChartCanvas
              config={passRateConfig}
              height={Math.max(260, passRateRows.slice(0, 12).length * 34)}
              ariaLabel="Pass rate by subject"
            />
          )}
        </ChartState>
      </Panel>

      <div className="analytics__split">
        <Panel>
          <PanelHeader title="Branch comparison" subtitle="Pass rate by branch." />
          <ChartState loading={branches.loading} error={branches.error} empty={!branchConfig}>
            {branchConfig && (
              <ChartCanvas config={branchConfig} height={280} ariaLabel="Pass rate by branch" />
            )}
          </ChartState>
        </Panel>

        <Panel>
          <PanelHeader title="CGPA distribution" subtitle="Students grouped by CGPA band." />
          <ChartState loading={distribution.loading} error={distribution.error} empty={!distConfig}>
            {distConfig && (
              <ChartCanvas config={distConfig} height={280} ariaLabel="CGPA distribution" />
            )}
          </ChartState>
        </Panel>
      </div>

      <p className="disclaimer analytics__caveat">
        Aggregated from analyzed enrollments only, not the full official RGPV student body.
      </p>
    </div>
  )
}
