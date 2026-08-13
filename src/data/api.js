// Compatibility layer preserving the original API contract used by the
// React pages. Instead of calling FastAPI/Supabase, it loads the local
// public/data/students.json dataset once (via data.js) and computes results
// with pure functions in analytics.js.
//
//   page -> api.js -> loadStudents() -> analytics.js -> result
//
// No HTTP requests, no backend, no database.

import { loadStudents } from "./data.js"
import * as analytics from "../utils/analytics.js"

const NOT_FOUND = Symbol("not-found")

export async function getSummary(semester = "") {
  const dataset = await loadStudents()
  return analytics.getSummary(dataset, semester)
}

export async function getStudent(enrollment) {
  const dataset = await loadStudents()
  return analytics.getStudent(dataset, enrollment)
}

export async function getToppers(semester = "", limit = 10) {
  const dataset = await loadStudents()
  return analytics.getToppers(dataset, semester, limit)
}

export async function getTopFailers(semester = "", limit = 50) {
  const dataset = await loadStudents()
  return analytics.getTopFailers(dataset, semester, limit)
}

export async function getSubjectPassRates(semester = "", subjectType = "Theory") {
  const dataset = await loadStudents()
  return analytics.getSubjectPassRates(dataset, semester, subjectType)
}

export async function getBranchComparison(semester = "") {
  const dataset = await loadStudents()
  return analytics.getBranchComparison(dataset, semester)
}

export async function getCgpaDistribution(semester = "") {
  const dataset = await loadStudents()
  return analytics.getCgpaDistribution(dataset, semester)
}

export async function searchByName(query) {
  const dataset = await loadStudents()
  return analytics.searchByName(dataset, query)
}

export { NOT_FOUND }
