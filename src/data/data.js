// Loads the (future) public/data/students.json dataset once and shares it
// across the whole app via a single cached promise. Provides an O(1)
// enrollment -> student lookup Map for fast getStudent() calls.

const DATA_URL = "/data/students.json"

let cachedPromise = null

function buildEnrollmentMap(students) {
  const map = new Map()
  for (const s of students) {
    if (s && s.enrollment !== undefined && s.enrollment !== null) {
      map.set(String(s.enrollment), s)
    }
  }
  return map
}

// Returns a Promise<{ students: Array, enrollmentMap: Map }>.
// The fetch only happens once; subsequent calls reuse the same promise.
export function loadStudents() {
  if (!cachedPromise) {
    cachedPromise = fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ${DATA_URL}: ${res.status}`)
        }
        return res.json()
      })
      .then((raw) => {
        const students = Array.isArray(raw) ? raw : raw?.students ?? []
        return {
          students,
          enrollmentMap: buildEnrollmentMap(students),
        }
      })
      .catch((err) => {
        // Reset the cache on failure so a later call can retry instead of
        // being stuck with a rejected promise forever.
        cachedPromise = null
        throw err
      })
  }
  return cachedPromise
}
