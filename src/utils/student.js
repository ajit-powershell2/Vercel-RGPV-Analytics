// Student result derivations — preserves the original selection logic.

// Pick the active result: prefer the requested semester, otherwise the most
// recently scraped result (matches original behavior).
export function pickActiveResult(results, wantedSemester) {
  if (!results || !results.length) return null
  let active = wantedSemester
    ? results.find((r) => String(r.semester) === String(wantedSemester))
    : null
  if (!active) {
    active = [...results].sort(
      (a, b) => new Date(b.scraped_at) - new Date(a.scraped_at),
    )[0]
  }
  return active
}

// Unique, numerically sorted semesters available for a student.
export function availableSemesters(results) {
  return results
    .map((r) => r.semester)
    .filter((v, i, arr) => v !== null && v !== undefined && arr.indexOf(v) === i)
    .sort((a, b) => Number(a) - Number(b))
}

// Chronological order by semester for progression chart.
export function orderedBySemester(results) {
  return [...results].sort((a, b) => Number(a.semester) - Number(b.semester))
}
