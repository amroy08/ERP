# Phase 3.1J: Student and Parent Marks Runtime Verification Notes

## Instant Score Propagation
When a teacher submits valid marks:
1. The backend performs an `upsert` in the database, inserting or updating the unique `Result` row (`examId + studentId + subjectId`).
2. Both Student and Parent result query logic maps the grade, percentage, and marks automatically from the DB on load.
3. Therefore, as soon as the teacher saves marks, the updated scores immediately propagate and become visible when the student logs in and navigates to the **Exams** screen or the parent views **Academics -> Results**.

## Parent/Student Security & Isolation
- **Student View**: Students can only access their own results.
- **Parent View**: Parents can query results exclusively for their linked children.
- **Verification**:
  - Logged in as `student@school.com` -> verified that `student_results_updated_marks.png` shows the updated score (e.g. 95/100, Grade A).
  - Logged in as `parent@school.com` -> verified that `parent_results_updated_marks.png` displays the correct updated score of Jane Doe, with zero access to unrelated pupils.
  - Zero crashes or red screens occurred across student, parent, or teacher flows.
