// Presentation helpers — pure, no side effects.

export function fmtNum(n, digits = 2) {
  return n === null || n === undefined || Number.isNaN(Number(n))
    ? "—"
    : Number(n).toFixed(digits)
}

export function fmtPercent(n) {
  return n === null || n === undefined ? "—" : `${n}%`
}

export function isFailed(resultText) {
  return !!resultText && resultText.toLowerCase().includes("fail")
}

export function initialOf(student) {
  return (student?.name || student?.enrollment || "?").trim().slice(0, 1).toUpperCase()
}

export const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"]
