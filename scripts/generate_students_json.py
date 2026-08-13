#!/usr/bin/env python3
"""
Reproducible migration: rgpv-data.sql (PostgreSQL data-only dump) -> public/data/students.json

Reads the COPY sections for the `public.students`, `public.results`,
`public.subjects`, and `public.subject_results` tables, joins them purely by
their relational IDs (never by parsing text), and writes a nested
student -> results -> subjects JSON tree consumed by src/data/data.js.

`public.scrape_log` and every other table in the dump (auth.*, storage.*, etc.)
are intentionally ignored — they are operational/infrastructure data, not
part of the analytics dataset.

Usage:
    python3 scripts/generate_students_json.py [path-to-sql-dump] [path-to-output-json]

Defaults:
    sql dump: <repo-root>/rgpv-data.sql
    output:   <repo-root>/public/data/students.json

The script performs strict integrity validation before writing anything. If
any check fails, it aborts (non-zero exit code) and writes nothing, so a
partially-broken dataset can never silently reach the frontend.
"""

import json
import sys
from pathlib import Path

NULL_MARKER = "\\N"


class MigrationError(Exception):
    """Raised when the source SQL fails an integrity check."""


# ---------------------------------------------------------------------------
# COPY block parsing
# ---------------------------------------------------------------------------

def unescape_copy_field(raw):
    """Undo PostgreSQL COPY TEXT-format backslash escaping for one field."""
    if raw == NULL_MARKER:
        return None
    if "\\" not in raw:
        return raw
    out = []
    i = 0
    n = len(raw)
    while i < n:
        c = raw[i]
        if c == "\\" and i + 1 < n:
            nxt = raw[i + 1]
            mapping = {
                "t": "\t",
                "n": "\n",
                "r": "\r",
                "\\": "\\",
                "b": "\b",
                "f": "\f",
                "v": "\v",
            }
            if nxt in mapping:
                out.append(mapping[nxt])
                i += 2
                continue
        out.append(c)
        i += 1
    return "".join(out)


def parse_copy_block(sql_text, table_name):
    """Extract and parse a `COPY "schema"."table" (...) FROM stdin;` block.

    Returns (columns: list[str], rows: list[dict]).
    Raises MigrationError if the table's COPY block cannot be found.
    """
    marker = f'COPY "public"."{table_name}" ('
    start = sql_text.find(marker)
    if start == -1:
        raise MigrationError(f'Could not find COPY block for table "{table_name}"')

    header_end = sql_text.index("FROM stdin;", start)
    header_line = sql_text[start:header_end]
    # Column list is the parenthesized, double-quoted, comma-separated list
    paren_start = header_line.index("(")
    paren_end = header_line.rindex(")")
    columns_raw = header_line[paren_start + 1:paren_end]
    columns = [c.strip().strip('"') for c in columns_raw.split(",")]

    data_start = sql_text.index("\n", header_end) + 1
    data_end = sql_text.index("\n\\.\n", data_start)
    block = sql_text[data_start:data_end]

    rows = []
    for line in block.split("\n"):
        if line == "":
            continue
        fields = line.split("\t")
        if len(fields) != len(columns):
            raise MigrationError(
                f'Row in "{table_name}" has {len(fields)} fields, '
                f"expected {len(columns)}: {line!r}"
            )
        row = {col: unescape_copy_field(val) for col, val in zip(columns, fields)}
        rows.append(row)
    return columns, rows


# ---------------------------------------------------------------------------
# Numeric helpers
# ---------------------------------------------------------------------------

def to_number_or_none(v):
    """Convert a COPY field to int/float, preserving None. Raises on garbage."""
    if v is None:
        return None
    v = v.strip()
    if v == "":
        return None
    try:
        if "." in v or "e" in v.lower():
            return float(v)
        return int(v)
    except ValueError as exc:
        raise MigrationError(f"Could not parse numeric value {v!r}: {exc}") from exc


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

def run(sql_path: Path, output_path: Path):
    sql_text = sql_path.read_text(encoding="utf-8")

    _, student_rows = parse_copy_block(sql_text, "students")
    _, result_rows = parse_copy_block(sql_text, "results")
    _, subject_rows = parse_copy_block(sql_text, "subjects")
    _, subject_result_rows = parse_copy_block(sql_text, "subject_results")

    report = {}
    report["students"] = len(student_rows)
    report["results"] = len(result_rows)
    report["subjects"] = len(subject_rows)
    report["subject_results"] = len(subject_result_rows)

    errors = []

    # ---- students -----------------------------------------------------
    students_by_id = {}
    enrollments_seen = {}
    duplicate_enrollments = 0
    missing_student_fields = 0
    for row in student_rows:
        sid = row["id"]
        if sid in students_by_id:
            errors.append(f"Duplicate student id {sid}")
        students_by_id[sid] = row

        enrollment = row.get("enrollment")
        if not enrollment:
            missing_student_fields += 1
            errors.append(f"Student id {sid} missing enrollment")
        else:
            if enrollment in enrollments_seen:
                duplicate_enrollments += 1
                errors.append(
                    f"Duplicate enrollment {enrollment!r} "
                    f"(student ids {enrollments_seen[enrollment]} and {sid})"
                )
            enrollments_seen[enrollment] = sid

        if not row.get("name"):
            missing_student_fields += 1
            errors.append(f"Student id {sid} ({enrollment}) missing name")

    report["duplicate_enrollments"] = duplicate_enrollments
    report["missing_student_fields"] = missing_student_fields

    # ---- subjects -------------------------------------------------------
    subjects_by_id = {}
    subject_codes_seen = {}
    duplicate_subject_codes = 0
    subjects_missing_code = 0
    for row in subject_rows:
        sub_id = row["id"]
        if sub_id in subjects_by_id:
            errors.append(f"Duplicate subject id {sub_id}")
        subjects_by_id[sub_id] = row

        code = row.get("code")
        if not code:
            subjects_missing_code += 1
            errors.append(f"Subject id {sub_id} missing code")
        else:
            if code in subject_codes_seen:
                duplicate_subject_codes += 1
                errors.append(
                    f"Duplicate subject code {code!r} "
                    f"(subject ids {subject_codes_seen[code]} and {sub_id})"
                )
            subject_codes_seen[code] = sub_id

    report["duplicate_subject_codes"] = duplicate_subject_codes
    report["subjects_missing_code"] = subjects_missing_code

    # ---- results ----------------------------------------------------------
    results_by_id = {}
    orphan_results = 0
    missing_result_fields = 0
    malformed_numeric = 0
    student_semester_seen = {}
    duplicate_student_semester = 0
    results_by_student = {}

    for row in result_rows:
        rid = row["id"]
        if rid in results_by_id:
            errors.append(f"Duplicate result id {rid}")
        results_by_id[rid] = row

        sid = row.get("student_id")
        if sid not in students_by_id:
            orphan_results += 1
            errors.append(f"Result id {rid} references missing student_id {sid}")
            continue

        if not row.get("semester"):
            missing_result_fields += 1
            errors.append(f"Result id {rid} missing semester")

        for numeric_field in ("sgpa", "cgpa"):
            raw = row.get(numeric_field)
            if raw is not None:
                try:
                    to_number_or_none(raw)
                except MigrationError:
                    malformed_numeric += 1
                    errors.append(
                        f"Result id {rid} has malformed {numeric_field} {raw!r}"
                    )

        sem_key = (sid, row.get("semester"))
        if sem_key in student_semester_seen:
            duplicate_student_semester += 1
            errors.append(
                f"Duplicate (student_id={sid}, semester={row.get('semester')}) "
                f"results (ids {student_semester_seen[sem_key]} and {rid})"
            )
        student_semester_seen[sem_key] = rid

        results_by_student.setdefault(sid, []).append(row)

    students_without_results = sum(
        1 for sid in students_by_id if sid not in results_by_student
    )

    report["orphan_results"] = orphan_results
    report["missing_result_fields"] = missing_result_fields
    report["malformed_numeric"] = malformed_numeric
    report["duplicate_student_semester_results"] = duplicate_student_semester
    report["students_without_results"] = students_without_results

    # ---- subject_results ----------------------------------------------------
    orphan_sr_result = 0
    orphan_sr_subject = 0
    duplicate_result_subject = 0
    subject_results_by_result = {}
    seen_result_subject_pairs = set()

    for row in subject_result_rows:
        sr_id = row["id"]
        result_id = row.get("result_id")
        subject_id = row.get("subject_id")

        if result_id not in results_by_id:
            orphan_sr_result += 1
            errors.append(
                f"subject_results id {sr_id} references missing result_id {result_id}"
            )
            continue
        if subject_id not in subjects_by_id:
            orphan_sr_subject += 1
            errors.append(
                f"subject_results id {sr_id} references missing subject_id {subject_id}"
            )
            continue

        pair = (result_id, subject_id)
        if pair in seen_result_subject_pairs:
            duplicate_result_subject += 1
            errors.append(
                f"Duplicate (result_id={result_id}, subject_id={subject_id}) "
                f"subject_results relationship (row id {sr_id})"
            )
        seen_result_subject_pairs.add(pair)

        subject_results_by_result.setdefault(result_id, []).append(row)

    report["orphan_subject_results_missing_result"] = orphan_sr_result
    report["orphan_subject_results_missing_subject"] = orphan_sr_subject
    report["duplicate_result_subject_relationships"] = duplicate_result_subject

    # ---- abort on any integrity failure ------------------------------------
    if errors:
        print("MIGRATION ABORTED - integrity check failures:", file=sys.stderr)
        for e in errors[:200]:
            print(f"  - {e}", file=sys.stderr)
        if len(errors) > 200:
            print(f"  ... and {len(errors) - 200} more", file=sys.stderr)
        raise MigrationError(f"{len(errors)} integrity error(s) found; aborting.")

    # ---- build nested JSON ---------------------------------------------------
    generated_students = 0
    generated_results = 0
    generated_subject_results = 0

    students_json = []
    for row in student_rows:
        sid = row["id"]
        student_results = []
        for r in results_by_student.get(sid, []):
            rid = r["id"]
            sr_rows = subject_results_by_result.get(rid, [])
            subjects_json = []
            for sr in sr_rows:
                subj = subjects_by_id[sr["subject_id"]]
                subjects_json.append(
                    {
                        "subject_code": subj.get("code"),
                        "subject_name": subj.get("name"),
                        "type": subj.get("type"),
                        "grade": sr.get("grade"),
                        "earned_credit": to_number_or_none(sr.get("earned_credit")),
                    }
                )
                generated_subject_results += 1

            student_results.append(
                {
                    "semester": r.get("semester"),
                    "session": r.get("session"),
                    "sgpa": to_number_or_none(r.get("sgpa")),
                    "cgpa": to_number_or_none(r.get("cgpa")),
                    "status": r.get("status"),
                    "result": r.get("result"),
                    "scraped_at": r.get("scraped_at"),
                    "subjects": subjects_json,
                }
            )
            generated_results += 1

        students_json.append(
            {
                "enrollment": row.get("enrollment"),
                "name": row.get("name"),
                "course": row.get("course"),
                "branch": row.get("branch"),
                "results": student_results,
            }
        )
        generated_students += 1

    report["generated_students"] = generated_students
    report["generated_results"] = generated_results
    report["generated_subject_results"] = generated_subject_results

    # ---- post-build validation: generated tree matches source counts --------
    post_errors = []
    if generated_students != len(student_rows):
        post_errors.append(
            f"Generated student count {generated_students} != source {len(student_rows)}"
        )
    if generated_results != len(result_rows):
        post_errors.append(
            f"Generated result count {generated_results} != source {len(result_rows)}"
        )
    if generated_subject_results != len(subject_result_rows):
        post_errors.append(
            f"Generated subject_result count {generated_subject_results} != "
            f"source {len(subject_result_rows)}"
        )

    generated_enrollments = {s["enrollment"] for s in students_json}
    if len(generated_enrollments) != len(students_json):
        post_errors.append("Generated JSON contains duplicate enrollments")

    if post_errors:
        print("MIGRATION ABORTED - post-build validation failures:", file=sys.stderr)
        for e in post_errors:
            print(f"  - {e}", file=sys.stderr)
        raise MigrationError("Post-build validation failed; aborting.")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(students_json, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # ---- report ---------------------------------------------------------------
    print("Migration report")
    print("=================")
    print(f"Students:                 {report['students']}")
    print(f"Results:                  {report['results']}")
    print(f"Subjects:                 {report['subjects']}")
    print(f"Subject results:          {report['subject_results']}")
    print(f"Duplicate enrollments:    {report['duplicate_enrollments']}")
    print(f"Duplicate subject codes:  {report['duplicate_subject_codes']}")
    print(f"Orphan results:           {report['orphan_results']}")
    print(f"Students without results: {report['students_without_results']}")
    print(f"Orphan subject_results (missing result):  {report['orphan_subject_results_missing_result']}")
    print(f"Orphan subject_results (missing subject): {report['orphan_subject_results_missing_subject']}")
    print(f"Duplicate result/subject relationships:   {report['duplicate_result_subject_relationships']}")
    print(f"Duplicate (student,semester) results:     {report['duplicate_student_semester_results']}")
    print(f"Malformed numeric SGPA/CGPA values:        {report['malformed_numeric']}")
    print(f"Subjects missing code:    {report['subjects_missing_code']}")
    print("-----------------")
    print(f"Generated students:        {generated_students}")
    print(f"Generated results:         {generated_results}")
    print(f"Generated subject results: {generated_subject_results}")
    print(f"Output written to: {output_path}")

    return report


def main():
    repo_root = Path(__file__).resolve().parent.parent
    sql_path = Path(sys.argv[1]) if len(sys.argv) > 1 else repo_root / "rgpv-data.sql"
    output_path = (
        Path(sys.argv[2]) if len(sys.argv) > 2 else repo_root / "public" / "data" / "students.json"
    )

    if not sql_path.exists():
        print(f"SQL dump not found: {sql_path}", file=sys.stderr)
        sys.exit(1)

    try:
        run(sql_path, output_path)
    except MigrationError as exc:
        print(f"\nMigration failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()