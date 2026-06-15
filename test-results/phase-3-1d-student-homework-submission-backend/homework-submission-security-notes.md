# Homework Submission Security Notes - Phase 3.1D

## Security Policies & Assertions

### 1. Authentication & Role Authorization
- Any request without a valid JWT token is rejected (401 Unauthorized).
- Homework submission and status endpoints (`/api/mobile/student/homework/:homeworkId/submit` and `/api/mobile/student/homework/:homeworkId/submission`) are protected and only accessible to users with the `student` role.
- Attempts by teachers or parents to post submissions to these endpoints are blocked with `403 Access Denied`.

### 2. Multi-tenant and Scope Boundary Protection (IDOR Prevention)
- **School Scoping**: Homework assignments are matched against the student's logged-in school ID (`schoolId`).
- **Class & Section Scoping**: A student is strictly forbidden from viewing or submitting homework assigned to classes or sections other than their own assigned class (`classId`) and section (`sectionId`).
- **Unrelated Submission Block**: The helper method `getStudentHomeworkOrThrow` verifies relationship matching before allowing any db query. Attempts by a student to retrieve or submit data for another student's assignment are rejected with `403 Access Denied`.

### 3. File Input Validation
- File filter rules limit valid uploads to standard documents and images (`.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`, and `.txt`).
- File uploads are capped at a maximum of `10MB`.
- If an invalid file type or oversized file is uploaded, the Multer middleware rejects the request and blocks storage.
