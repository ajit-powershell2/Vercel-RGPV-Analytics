// Pure JavaScript re-implementation of the old backend analytics endpoints.
// Operates on the in-memory dataset produced by src/data/data.js:
//   { students: Array<Student>, enrollmentMap: Map<enrollment, Student> }
//
// Student shape:
//   { enrollment, name, course, branch,
//     results: [{ semester, session, sgpa, cgpa, status, result, scraped_at,
//                  subjects: [{ subject_code, subject_name, type, grade, earned_credit }] }] }

// ---- Semester helpers (centralized) ----------------------------------

export function normalizeSemester(semester) {
  if (semester === null || semester === undefined) return null
  const s = String(semester).trim()
  return s === "" ? null : s
}

export function availableSemesters(students) {
  const set = new Set()
  for (const s of students) {
    for (const r of s.results || []) {
      const sem = normalizeSemester(r.semester)
      if (sem !== null) set.add(sem)
    }
  }
  return [...set].sort((a, b) => Number(a) - Number(b))
}

// Picks the "active" result for a student: the one matching `semester` if
// given, otherwise the most recently scraped result. Mirrors the selection
// logic used client-side in src/utils/student.js.
export function pickActiveResult(results, semester) {
  if (!results || results.length === 0) return null
  const sem = normalizeSemester(semester)
  if (sem !== null) {
    return results.find((r) => normalizeSemester(r.semester) === sem) || null
  }
  return [...results].sort(
    (a, b) => new Date(b.scraped_at || 0) - new Date(a.scraped_at || 0),
  )[0]
}

// ---- Failure semantics -------------------------------------------------

export function isFailed(result) {
  if (!result) return false
  if (typeof result.result === "string" && result.result.toLowerCase().includes("fail")) {
    return true
  }
  if (typeof result.status === "string" && result.status.toLowerCase().includes("fail")) {
    return true
  }
  return false
}

// Subject codes the university's own result string declares as failed,
// e.g. "Fail in CS304,CS305" -> ["CS304", "CS305"]. This is the
// authoritative source: RGPV's scraped `result` text reflects the
// officially declared outcome for that session, while a subject's stored
// grade can later show an improved/passing grade (grade improvement,
// re-evaluation, back-paper clearance recorded afterwards) without the
// summary `result` line ever being re-scraped. Relying on subject grades
// alone therefore silently drops real backlogs whenever the two disagree.
function declaredFailedCodes(result) {
  const text = result && typeof result.result === "string" ? result.result : ""
  const match = text.match(/fail\s+in\s+(.+)/i)
  if (!match) return null
  return match[1]
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
}

export function failedSubjectCount(result) {
  if (!result) return 0
  const declared = declaredFailedCodes(result)
  if (declared !== null) return declared.length
  if (!Array.isArray(result.subjects)) return 0
  return result.subjects.filter(
    (s) => typeof s.grade === "string" && /^(f|ab|absent)/i.test(s.grade.trim()),
  ).length
}

// ---- Numeric helpers -----------------------------------------------------

function toNum(v) {
  const n = Number(v)
  return v === null || v === undefined || Number.isNaN(n) ? null : n
}

function avg(nums) {
  const valid = nums.filter((n) => n !== null && n !== undefined && !Number.isNaN(n))
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

// Builds the "active result per student" cohort for a given semester filter.
// Students with no matching/available result are excluded.
function buildCohort(students, semester) {
  const cohort = []
  for (const s of students) {
    const active = pickActiveResult(s.results, semester)
    if (active) cohort.push({ student: s, result: active })
  }
  return cohort
}

// ---- getSummary ----------------------------------------------------------

export function getSummary(dataset, semester = "") {
  const cohort = buildCohort(dataset.students, semester)
  const total_students = cohort.length
  let passed = 0
  let failed = 0
  const cgpas = []
  const subjectSet = new Set()

  for (const { result } of cohort) {
    if (isFailed(result)) failed += 1
    else passed += 1
    if (result.cgpa !== null && result.cgpa !== undefined) cgpas.push(toNum(result.cgpa))
    for (const sub of result.subjects || []) {
      if (sub.subject_code) subjectSet.add(sub.subject_code)
    }
  }

  const average_cgpa = avg(cgpas)
  const highest_cgpa = cgpas.length ? Math.max(...cgpas.filter((n) => n !== null)) : null

  return {
    total_students,
    passed,
    failed,
    pass_percent: total_students ? Math.round((passed / total_students) * 1000) / 10 : null,
    average_cgpa,
    highest_cgpa,
    total_subjects_tracked: subjectSet.size,
  }
}

// ---- getStudent ------------------------------------------------------------

// Computes branch/college rank + percentile for one result, among all
// students who have a result for the same semester.
function computeRanks(dataset, result, branch) {
  const semester = normalizeSemester(result.semester)
  if (semester === null) {
    return { branch_rank: null, branch_total: null, college_rank: null, college_total: null, percentile: null }
  }

  const rows = []
  for (const s of dataset.students) {
    const r = (s.results || []).find((r2) => normalizeSemester(r2.semester) === semester)
    if (r) rows.push({ enrollment: s.enrollment, branch: s.branch, cgpa: toNum(r.cgpa) })
  }

  const byCgpaDesc = (a, b) => (b.cgpa ?? -Infinity) - (a.cgpa ?? -Infinity)
  const college = [...rows].sort(byCgpaDesc)
  const college_total = college.length
  const college_rank = college.findIndex((r) => String(r.enrollment) === String(result.__enrollment)) + 1 || null

  const branchRows = college.filter((r) => r.branch === branch)
  const branch_total = branchRows.length
  const branch_rank = branchRows.findIndex((r) => String(r.enrollment) === String(result.__enrollment)) + 1 || null

  const percentile =
    college_total && college_rank
      ? Math.round(((college_total - college_rank) / college_total) * 100)
      : null

  return { branch_rank, branch_total, college_rank, college_total, percentile }
}

export function getStudent(dataset, enrollment) {
  const student = dataset.enrollmentMap.get(String(enrollment))
  if (!student) return { __notFound: true }

  const results = (student.results || []).map((r) => {
    const tagged = { ...r, __enrollment: student.enrollment }
    const ranks = computeRanks(dataset, tagged, student.branch)
    const { __enrollment, ...clean } = tagged
    return { ...clean, ...ranks }
  })

  return { ...student, results }
}

// ---- getToppers / getTopFailers -------------------------------------------

export function getToppers(dataset, semester = "", limit = 10) {
  const cohort = buildCohort(dataset.students, semester)
  const rows = cohort
    .filter(({ result }) => toNum(result.cgpa) !== null)
    .sort((a, b) => toNum(b.result.cgpa) - toNum(a.result.cgpa))
    .slice(0, limit)

  return rows.map(({ student, result }, i) => ({
    rank: i + 1,
    enrollment: student.enrollment,
    name: student.name,
    branch: student.branch,
    semester: result.semester,
    cgpa: toNum(result.cgpa),
  }))
}

export function getTopFailers(dataset, semester = "", limit = 50) {
  const cohort = buildCohort(dataset.students, semester)
  const rows = cohort
    .map(({ student, result }) => ({ student, result, failed_count: failedSubjectCount(result) }))
    .filter(({ result, failed_count }) => isFailed(result) || failed_count > 0)
    .sort((a, b) => b.failed_count - a.failed_count)
    .slice(0, limit)

  return rows.map(({ student, result, failed_count }) => ({
    enrollment: student.enrollment,
    name: student.name,
    branch: student.branch,
    semester: result.semester,
    failed_count,
  }))
}

// ---- getSubjectPassRates ----------------------------------------------------

export function getSubjectPassRates(dataset, semester = "", subjectType = "Theory") {
  const cohort = buildCohort(dataset.students, semester)
  const bySubject = new Map()

  for (const { result } of cohort) {
    for (const sub of result.subjects || []) {
      if (!sub.subject_code) continue
      if (subjectType && sub.type && sub.type !== subjectType) continue
      const key = sub.subject_code
      const entry = bySubject.get(key) || {
        subject_code: sub.subject_code,
        subject_name: sub.subject_name || sub.subject_code,
        total: 0,
        passed: 0,
      }
      entry.total += 1
      const failedSubject = typeof sub.grade === "string" && /^(f|ab|absent)/i.test(sub.grade.trim())
      if (!failedSubject) entry.passed += 1
      bySubject.set(key, entry)
    }
  }

  return [...bySubject.values()]
    .map((e) => ({
      subject_code: e.subject_code,
      subject_name: e.subject_name,
      pass_percent: e.total ? Math.round((e.passed / e.total) * 1000) / 10 : null,
    }))
    .sort((a, b) => (b.pass_percent ?? 0) - (a.pass_percent ?? 0))
}

// ---- getBranchComparison ----------------------------------------------------

export function getBranchComparison(dataset, semester = "") {
  const cohort = buildCohort(dataset.students, semester)
  const byBranch = new Map()

  for (const { student, result } of cohort) {
    const branch = student.branch || "Unknown"
    const entry = byBranch.get(branch) || { branch, total: 0, passed: 0, cgpas: [] }
    entry.total += 1
    if (!isFailed(result)) entry.passed += 1
    if (result.cgpa !== null && result.cgpa !== undefined) entry.cgpas.push(toNum(result.cgpa))
    byBranch.set(branch, entry)
  }

  return [...byBranch.values()]
    .map((e) => ({
      branch: e.branch,
      pass_percent: e.total ? Math.round((e.passed / e.total) * 1000) / 10 : null,
      average_cgpa: avg(e.cgpas),
    }))
    .sort((a, b) => (b.pass_percent ?? 0) - (a.pass_percent ?? 0))
}

// ---- getCgpaDistribution -----------------------------------------------------

const CGPA_BUCKETS = [
  { range: "9-10", min: 9, max: 10 },
  { range: "8-9", min: 8, max: 9 },
  { range: "7-8", min: 7, max: 8 },
  { range: "6-7", min: 6, max: 7 },
  { range: "5-6", min: 5, max: 6 },
  { range: "Below 5", min: -Infinity, max: 5 },
]

export function getCgpaDistribution(dataset, semester = "") {
  const cohort = buildCohort(dataset.students, semester)
  const counts = CGPA_BUCKETS.map((b) => ({ range: b.range, count: 0 }))

  for (const { result } of cohort) {
    const cgpa = toNum(result.cgpa)
    if (cgpa === null) continue
    const idx = CGPA_BUCKETS.findIndex((b) => cgpa >= b.min && cgpa < b.max || (b.max === 10 && cgpa === 10))
    if (idx !== -1) counts[idx].count += 1
  }

  return counts
}

// ---- searchByName -------------------------------------------------------------

export function searchByName(dataset, query) {
  const q = String(query || "").trim().toLowerCase()
  if (!q) return []

  const matches = dataset.students.filter((s) => (s.name || "").toLowerCase().includes(q))

  return matches.map((s) => {
    const active = pickActiveResult(s.results, "")
    return {
      enrollment: s.enrollment,
      name: s.name,
      branch: s.branch,
      semester: active?.semester ?? null,
      cgpa: active ? toNum(active.cgpa) : null,
    }
  })
}
