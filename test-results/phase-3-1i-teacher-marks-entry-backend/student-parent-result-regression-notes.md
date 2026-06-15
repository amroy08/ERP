# Student/Parent Result Compatibility Notes

To ensure that the newly saved teacher marks correctly flow to students and parents, we reviewed and verified the compatibility of existing endpoints.

## Compatibility Verification Details:

1. **`GET /api/mobile/student/results`**
   - **Endpoint Flow**: Retrieves all records from the `Result` model matching the student's `studentId`.
   - **Accents**: Automatically resolves relations to fetch `exam.name` as `examTitle` and `subject.name` as `subjectName`.
   - **Verification**: Once the teacher saves marks for `Jane Doe`, the student gets the updated marks (`88/100`), percentage, and grade (`A`) dynamically calculated on load.

2. **`GET /api/mobile/parent/student/:studentId/results`**
   - **Endpoint Flow**: Authenticates parent identity, ensures student is linked to parent (IDOR verification), and queries the `Result` model.
   - **Verification**: The parent correctly sees the updated child marks (`88/100`), grade (`A`), and percentage without any extra action.

3. **Data Safety (Security Boundary)**:
   - Results are strictly scoped to the student (for student login) and the linked child (for parent login).
   - Any attempt by an unauthorized parent/student to query other student results returns `403 Forbidden` as verified in our integration tests.
