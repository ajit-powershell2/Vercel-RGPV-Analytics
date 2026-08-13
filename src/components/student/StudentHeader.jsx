import StatusBadge from "../StatusBadge.jsx"
import { initialOf, isFailed } from "../../utils/format.js"
import "./StudentHeader.css"

export default function StudentHeader({ student, active, semesters, onSelectSemester }) {
  const failed = isFailed(active.result)

  return (
    <header className="student-header">
      <div className="student-header__identity">
        <div className="student-header__avatar" aria-hidden="true">
          {initialOf(student)}
        </div>
        <div>
          <h1 className="student-header__name">
            {student.name || "Name not recorded"}
          </h1>
          <p className="student-header__meta">
            {student.enrollment}
            <span className="student-header__dot" aria-hidden="true" />
            {student.branch || student.course || "—"}
          </p>
        </div>
        <div className="student-header__status">
          <StatusBadge tone={failed ? "fail" : "pass"}>
            {failed ? "Fail" : "Pass"}
          </StatusBadge>
        </div>
      </div>

      {semesters.length > 0 && (
        <div className="student-header__chips" role="tablist" aria-label="Semester">
          {semesters.map((sem) => {
            const isActive = String(sem) === String(active.semester)
            return (
              <button
                key={sem}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`sem-chip${isActive ? " sem-chip--active" : ""}`}
                onClick={() => onSelectSemester(String(sem))}
              >
                Sem {sem}
              </button>
            )
          })}
        </div>
      )}
    </header>
  )
}
