# Phase 3.2C: Web-to-Mobile Marks Sync Notes

## Synchronization Workflows
Both mobile and web consoles operate on the exact same database records (`Exam` and `Result`), guaranteeing instant synchronization across platforms without duplication.

### Sync Verification Scenarios:
1. **Mobile Teacher Entry → Web Gradebook**:
   - Teacher inputs marks via the mobile app (`POST /teacher/marks/exams/:examId/save`).
   - Web console reflects the entry in the Gradebook counts and subject marks registers immediately upon page refresh.
2. **Web Entry → Mobile Student/Parent View**:
   - Administrator or teacher saves/updates student marks in the Web Gradebook.
   - Student results and Parent linked child results views fetch the updated marks (`GET /student/results`, `GET /parent/student/:id/results`) on their next screen refresh.
3. **Web Entry → Mobile Teacher Screen**:
   - Web console updates marks for a student.
   - Mobile teacher marks entry screen displays prefilled updated marks upon loading.
