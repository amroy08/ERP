# Teacher Homework Review Endpoint Notes — Phase 3.1F

## Endpoints Added

All routes are under `/api/mobile` and require `Authorization: Bearer <token>` with role `teacher`.

---

### 1. GET /api/mobile/teacher/homework
Returns all homework items the teacher is authorized to review.

**Response fields per item:**
- `homeworkId`, `title`, `description`
- `className`, `sectionName`, `subjectName`
- `dueDate`, `assignedDate`, `createdAt`
- `totalStudents` — count of active students in class/section
- `submittedCount` — students who submitted (any non-pending status)
- `pendingCount` — students who have not submitted yet
- `reviewedCount` — submissions with status `reviewed`
- `returnedCount` — submissions with status `returned`
- `lateCount` — submissions with status `late`

---

### 2. GET /api/mobile/teacher/homework/:homeworkId/submissions
Returns homework details + full student/submission list.

**Response structure:**
```json
{
  "homework": { "homeworkId", "title", "className", "sectionName", "subjectName", "dueDate" },
  "students": [
    {
      "studentId", "studentName", "admissionNumber", "rollNumber",
      "submissionId",         // null if not submitted
      "status",               // pending | submitted | late | reviewed | returned
      "submittedAt", "hasFile", "hasText", "fileName",
      "marks", "teacherFeedback", "reviewedAt"
    }
  ]
}
```
Students who haven't submitted appear as `status: pending` with `submissionId: null`.

---

### 3. GET /api/mobile/teacher/homework/submissions/:submissionId
Full detail of a single submission.

**Response includes:**
- `submissionId`, `homeworkId`, `homeworkTitle`
- `className`, `sectionName`, `subjectName`, `dueDate`
- `student`: `{ studentId, studentName, admissionNumber, rollNumber }`
- `submissionText`, `fileName`, `mimeType`, `fileSize`
- `status`, `submittedAt`, `teacherFeedback`, `marks`, `reviewedAt`
- `canReview` — true if status is submitted or late
- `canReturn` — true if status is reviewed
- `canDownload` — true if both fileName and filePath exist

> ⚠️ `filePath` is intentionally excluded from all JSON responses.

---

### 4. PATCH /api/mobile/teacher/homework/submissions/:submissionId/review
Teacher adds feedback/marks and sets status.

**Request body:**
```json
{
  "status": "reviewed",         // or "returned" — optional
  "teacherFeedback": "...",     // optional
  "marks": 9                    // optional, must be >= 0
}
```

**Behavior:**
- `reviewedAt` is set to current timestamp when `status` is provided.
- `reviewedById` is set to the teacher's `userId`.
- Push notification is sent to student (best-effort, non-blocking).
- All fields are optional — can update marks/feedback without changing status.

**Validation:**
- `status` must be `reviewed` or `returned` (400 otherwise).
- `marks` must be a number >= 0 (400 for negative values).

---

### 5. GET /api/mobile/teacher/homework/submissions/:submissionId/download
Securely streams the private submission file.

**Security:**
- Teacher must be authorized for the submission's homework.
- Path is resolved and verified to be inside `private_uploads/homework-submissions/`.
- Returns 404 if no file attached or file missing from disk.
- Returns 403 if path resolves outside safe base (path traversal prevention).
- File served via `res.download(path, originalFileName)`.

---

## Route Order (Important)
Routes are registered in order to prevent conflicts:
```
/teacher/homework/submissions/:submissionId/download  (specific first)
/teacher/homework/submissions/:submissionId
/teacher/homework/submissions/:submissionId/review
/teacher/homework/:homeworkId/submissions
/teacher/homework
```
