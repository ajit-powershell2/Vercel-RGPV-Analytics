import { useState } from "react"
import { Link } from "react-router-dom"
import { searchByName } from "../data/api.js"
import { useAsync } from "../utils/useAsync.js"
import { fmtNum } from "../utils/format.js"
import SectionHeader from "../components/SectionHeader.jsx"
import Panel from "../components/Panel.jsx"
import Button from "../components/Button.jsx"
import { Skeleton, StateBlock } from "../components/States.jsx"
import "./Search.css"

export default function Search() {
  const [input, setInput] = useState("")
  const [query, setQuery] = useState("")

  // Only hit the API once a query has been submitted; idle state otherwise.
  const { loading, error, data } = useAsync(
    () => (query ? searchByName(query) : Promise.resolve(null)),
    [query],
  )
  const results = Array.isArray(data) ? data : []

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    setQuery(trimmed)
  }

  return (
    <div className="page stack-6">
      <SectionHeader
        eyebrow="Find a student"
        title="Search by name"
        subtitle="Look up analyzed students by name, then open a full result."
      />

      <Panel>
        <form className="search-form" onSubmit={handleSubmit} role="search">
          <label className="search-form__label" htmlFor="name-search">
            Student name
          </label>
          <div className="search-form__row">
            <input
              id="name-search"
              type="text"
              className="search-form__input"
              placeholder="e.g. Aditya Sharma"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <Button type="submit" variant="primary">
              Search
            </Button>
          </div>
        </form>
      </Panel>

      <Panel>
        {!query ? (
          <StateBlock
            title="Search for a student"
            message="Type a name above and press Search to find matching analyzed results."
          />
        ) : loading ? (
          <div className="search-skeleton">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={58} radius="var(--r-md)" />
            ))}
          </div>
        ) : error ? (
          <StateBlock tone="error" title="Couldn't run the search" message="Please try again shortly." />
        ) : results.length === 0 ? (
          <StateBlock
            title="No matches found"
            message={`No analyzed students matched "${query}". Try a different spelling.`}
          />
        ) : (
          <ul className="search-results">
            {results.map((r, i) => (
              <li key={`${r.enrollment}-${i}`} className="search-result">
                <div className="search-result__info">
                  <Link
                    to={`/student/${encodeURIComponent(r.enrollment)}`}
                    className="search-result__name"
                  >
                    {r.name || r.enrollment}
                  </Link>
                  <span className="search-result__sub">
                    {r.enrollment} · {r.branch || "—"} · Sem {r.semester ?? "—"}
                  </span>
                </div>
                {r.cgpa != null && (
                  <span className="search-result__cgpa">
                    {fmtNum(r.cgpa)}
                    <span className="search-result__cgpa-label">CGPA</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
