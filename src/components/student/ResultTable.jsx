import "./ResultTable.css"

export default function ResultTable({ subjects }) {
  if (!subjects || subjects.length === 0) {
    return (
      <p className="result-table__empty">
        No subject-level data stored for this result.
      </p>
    )
  }

  return (
    <div className="result-table" role="table" aria-label="Subject results">
      <div className="result-table__head" role="row">
        <span role="columnheader">Code</span>
        <span role="columnheader">Subject</span>
        <span role="columnheader" className="result-table__grade-col">
          Grade
        </span>
      </div>
      {subjects.map((s, i) => (
        <div className="result-table__row" role="row" key={`${s.subject_code}-${i}`}>
          <span className="result-table__code" role="cell" data-label="Code">
            {s.subject_code}
          </span>
          <span className="result-table__name" role="cell" data-label="Subject">
            {s.subject_name || "—"}
          </span>
          <span className="result-table__grade-col" role="cell" data-label="Grade">
            <span className="grade-pill">{s.grade || "—"}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
