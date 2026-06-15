# Phase 3.1K Audit: Marks & Academics Security Verification

## Summary of Security Safeguards

A comprehensive API security audit was conducted using both script-based assertions and manual routing checks to ensure marks and results data are properly isolated.

## API Endpoint Access Control Matrix

| Endpoint | Guest/Anon | Student | Parent | Teacher | Admin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/mobile/teacher/marks/exams` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ 200 | ✅ 200 |
| `POST /api/mobile/teacher/marks/exams/:id/save` | ❌ 401 | ❌ 403 | ❌ 403 | ✅ 200 | ✅ 200 |
| `GET /api/mobile/student/results` | ❌ 401 | ✅ 200 (Own) | ❌ 403 | ❌ 403 | ✅ 200 |
| `GET /api/mobile/parent/student/:id/results` | ❌ 401 | ❌ 403 | ✅ 200 (Child) | ❌ 403 | ✅ 200 |

## Key Security Verification Findings

### 1. Role-Based Access Control (RBAC)
- Checked that student and parent requests to teacher-only endpoints (e.g., list exams for marks entry, save marks) are hard-blocked at the middleware layer, returning `HTTP 403 Forbidden`.
- Unauthenticated requests to any mobile endpoints are rejected with `HTTP 401 Unauthorized`.

### 2. Insecure Direct Object Reference (IDOR) Prevention
- **Teacher Marks Entry Scoping**: Teachers can only view exams and save marks for classes and subjects they are actively assigned to teach. Fabrication of student IDs or exam IDs in parameters returns `404 Not Found` or `403 Forbidden` if outside the teacher's taught schedule scope.
- **Parent Child Scoping**: Parents can only access result sheets for students that are linked to their parent account via the `parentId` relation in the database. Requests with unlinked student IDs are rejected with `HTTP 403 Access Denied`.

### 3. Database Upsert Constraints
- Tested the save marks endpoint with duplicate uploads for the same `(examId, studentId, subjectId)`.
- Verified that subsequent saves update the existing row in the `Result` table rather than appending duplicate entries, respecting the unique index constraints:
  `@@unique([examId, studentId, subjectId])`
- This ensures database size consistency and prevents double-grading anomalies.

---
*Verified via backend script test assertions.*
