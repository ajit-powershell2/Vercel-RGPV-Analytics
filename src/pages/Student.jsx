import { useMemo } from "react"
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom"
import { getStudent } from "../data/api.js"
import { useAsync } from "../utils/useAsync.js"
import { pickActiveResult, availableSemesters, orderedBySemester } from "../utils/student.js"
import Panel, { PanelHeader } from "../components/Panel.jsx"
import Button from "../components/Button.jsx"
import ChartCanvas from "../components/Chart.jsx"
import { Skeleton, StateBlock } from "../components/States.jsx"
import StudentHeader from "../components/student/StudentHeader.jsx"
import PerformanceMetrics from "../components/student/PerformanceMetrics.jsx"
import ResultTable from "../components/student/ResultTable.jsx"
import { CHART, legendBottom, gridScale, categoryScale } from "../components/chartTheme.js"
import "./Student.css"

function InfoGrid({ student, active }) {
  const items = [
    { label: "Enrollment No.", value: student.enrollment },
    { label: "Name", value: student.name || "—" },
    { label: "Course", value: student.course || "—" },
    { label: "Branch", value: student.branch || "—" },
    { label: "Semester", value: active.semester ?? "—" },
    { label: "Status", value: active.status || "—" },
    { label: "Session", value: active.session || "—" },
  ]
  return (
    <div className="info-grid">
      {items.map((item) => (
        <div className="info-item" key={item.label}>
          <span className="info-item__label">{item.label}</span>
          <span className="info-item__value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Student() {
  const { enrollment } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const wantedSemester = searchParams.get("semester") || ""

  const { loading, error, data: student } = useAsync(
    () => getStudent(enrollment),
    [enrollment],
  )

  const results = student && !student.__notFound ? student.results : null
  const active = useMemo(
    () => (results ? pickActiveResult(results, wantedSemester) : null),
    [results, wantedSemester],
  )
  const semesters = useMemo(
    () => (results ? availableSemesters(results) : []),
    [results],
  )

  const progressionConfig = useMemo(() => {
    if (!results || results.length <= 1) return null
    const ordered = orderedBySemester(results)
    return {
      type: "line",
      data: {
        labels: ordered.map((r) => `Sem ${r.semester ?? "—"}`),
        datasets: [
          {
            label: "SGPA",
            data: ordered.map((r) => r.sgpa),
            borderColor: CHART.accent,
            backgroundColor: CHART.accent,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 5,
          },
          {
            label: "CGPA",
            data: ordered.map((r) => r.cgpa),
            borderColor: CHART.navy,
            backgroundColor: CHART.navy,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        scales: { y: { ...gridScale({ max: 10 }) }, x: { ...categoryScale() } },
        plugins: { legend: legendBottom },
      },
    }
  }, [results])

  const selectSemester = (sem) => {
    setSearchParams({ semester: sem }, { replace: true })
  }

  // ---- Loading ----
  if (loading) {
    return (
      <div className="page">
        <Button as={Link} to="/overview" variant="ghost" size="sm" className="student__back">
          ← Back
        </Button>
        <Panel style={{ marginTop: 16 }}>
          <Skeleton height={260} radius="var(--r-md)" />
        </Panel>
      </div>
    )
  }

  // ---- Not found / error ----
  if (error || !results || results.length === 0) {
    return (
      <div className="page">
        <Panel style={{ marginTop: 8 }}>
          <StateBlock
            title="Result not available yet"
            message={`We don't have a stored result for ${enrollment} yet. It may not have been added to our database so far — check back later.`}
            action={
              <Button variant="ghost" onClick={() => navigate("/overview")}>
                Search another enrollment
              </Button>
            }
          />
        </Panel>
      </div>
    )
  }

  // ---- Result ----
  return (
    <div className="page stack-4">
      <Button as={Link} to="/overview" variant="ghost" size="sm" className="student__back">
        ← Back
      </Button>

      <StudentHeader
        student={student}
        active={active}
        semesters={semesters}
        onSelectSemester={selectSemester}
      />

      <PerformanceMetrics active={active} />

      {results.length > 1 && progressionConfig && (
        <Panel>
          <PanelHeader
            title="SGPA / CGPA progression"
            subtitle="Semester-by-semester trend."
          />
          <ChartCanvas
            config={progressionConfig}
            height={230}
            ariaLabel="SGPA and CGPA progression across semesters"
          />
        </Panel>
      )}

      <Panel>
        <PanelHeader title="Student information" />
        <InfoGrid student={student} active={active} />
      </Panel>

      <Panel>
        <PanelHeader title="Result description" />
        <p className="student__description">
          {active.result || "No description available."}
        </p>
      </Panel>

      <Panel>
        <PanelHeader title="Subjects" />
        <ResultTable subjects={active.subjects} />
      </Panel>
    </div>
  )
}
