// Lightweight validation for the future public/data/students.json dataset.
// Not meant to be exhaustive — just enough to catch obviously broken data
// before it reaches the analytics layer.

function isBlank(v) {
  return v === null || v === undefined || String(v).trim() === ""
}

export function validateStudents(students) {
  const errors = []

  if (!Array.isArray(students)) {
    return { valid: false, errors: ["Dataset root must be an array of students."] }
  }

  const seenEnrollments = new Set()

  students.forEach((student, i) => {
    const where = `students[${i}]`

    if (!student || typeof student !== "object") {
      errors.push(`${where}: not an object`)
      return
    }

    if (isBlank(student.enrollment)) {
      errors.push(`${where}: missing enrollment number`)
    } else {
      const key = String(student.enrollment)
      if (seenEnrollments.has(key)) {
        errors.push(`${where}: duplicate enrollment number "${key}"`)
      }
      seenEnrollments.add(key)
    }

    if (!Array.isArray(student.results)) {
      errors.push(`${where}: results must be an array`)
      return
    }

    const seenSemesters = new Set()
    student.results.forEach((result, j) => {
      const rwhere = `${where}.results[${j}]`

      if (!result || typeof result !== "object") {
        errors.push(`${rwhere}: not an object`)
        return
      }

      if (isBlank(result.semester)) {
        errors.push(`${rwhere}: missing semester`)
      } else {
        const semKey = String(result.semester)
        if (seenSemesters.has(semKey)) {
          errors.push(`${rwhere}: duplicate result for semester "${semKey}"`)
        }
        seenSemesters.add(semKey)
      }

      if (result.sgpa !== null && result.sgpa !== undefined && Number.isNaN(Number(result.sgpa))) {
        errors.push(`${rwhere}: invalid sgpa "${result.sgpa}"`)
      }
      if (result.cgpa !== null && result.cgpa !== undefined && Number.isNaN(Number(result.cgpa))) {
        errors.push(`${rwhere}: invalid cgpa "${result.cgpa}"`)
      }

      if (result.subjects !== undefined && !Array.isArray(result.subjects)) {
        errors.push(`${rwhere}: subjects must be an array`)
      } else if (Array.isArray(result.subjects)) {
        result.subjects.forEach((sub, k) => {
          const swhere = `${rwhere}.subjects[${k}]`
          if (!sub || typeof sub !== "object") {
            errors.push(`${swhere}: not an object`)
            return
          }
          if (isBlank(sub.subject_code)) {
            errors.push(`${swhere}: missing subject code`)
          }
        })
      }
    })
  })

  return { valid: errors.length === 0, errors }
}
