import { SEMESTERS } from "../utils/format.js"
import "./SemesterFilter.css"

export default function SemesterFilter({ value, onChange, id = "sem-select" }) {
  return (
    <div className="sem-filter">
      <label className="sem-filter__label" htmlFor={id}>
        Semester
      </label>
      <select
        id={id}
        className="sem-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All semesters</option>
        {SEMESTERS.map((s) => (
          <option key={s} value={s}>
            Semester {s}
          </option>
        ))}
      </select>
    </div>
  )
}
