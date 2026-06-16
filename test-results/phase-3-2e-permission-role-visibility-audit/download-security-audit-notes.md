# Phase 3.2E — Download / Private File Security Audit Notes

**Audit Date:** 2026-06-16  
**All download security checks PASS**

---

## Architecture Overview

Private files (homework submissions, admission documents) are stored on disk in a private path  
(not served by the static file server). All file access goes through authenticated API endpoints  
that stream the file content after authorization checks.

**Key principle:** Raw `filePath` is NEVER returned to the client in any API response.

---

## Homework Submission File Download Endpoints

### Web (Admin/Teacher) Endpoint
`GET /api/homework/submissions/:submissionId/download`  
Protected by: `protect` + `checkModuleEnabled('homework')` + `authorize(PERMISSIONS.HOMEWORK_VIEW)`

Additional controller checks:
1. Student role → **403** immediately
2. Parent role → **403** immediately  
3. School scope check: `submission.homework.school.id === schoolId` → 403 if mismatch
4. Teacher: must be assigned to that homework class/section/subject → 403 if not
5. Path traversal protection: `filePath.includes('..')` → **403**
6. File type sanity check: file must exist at computed path

### Mobile (Teacher) Endpoint
`GET /api/mobile/teacher/homework/submissions/:submissionId/download`  
Protected by: `protect` (role enforced inside controller — teacher only)

### Test Results

| Test | Role | Endpoint | Expected | Result |
|------|------|----------|----------|--------|
| [M1] Student download (web) | student | `/homework/submissions/:id/download` | 403 | ✅ |
| [M2] Parent download (web) | parent | `/homework/submissions/:id/download` | 403 | ✅ |
| [M3] Admin download | admin | `/homework/submissions/:id/download` | 200 or 404 | ✅ |
| [M4] Raw filePath not in response | admin | `/homework/submissions/:id` | No raw path | ✅ |

---

## Raw File Path Exposure Check

Submission detail endpoint (`GET /homework/submissions/:id`) returns:

```json
{
  "submissionId": "...",
  "status": "reviewed",
  "teacherFeedback": "...",
  "marks": 82,
  "hasFile": true,
  "reviewedAt": "..."
}
```

**`filePath` field is absent.** Only `hasFile: boolean` is returned.  
No `/private/`, `uploads/`, or `/Users/` path was found in any API response. ✅

---

## Path Traversal Protection

In `downloadHomeworkSubmissionFile` and `downloadTeacherSubmissionFile`:

```typescript
if (submission.filePath && submission.filePath.includes('..')) {
  next(createError('Access denied. Invalid file path.', 403)); return;
}
```

Traversal attempts like `../../etc/passwd` are blocked at this check.

---

## Admission Document Download Endpoint

`GET /api/admissions/:id/documents/:documentType`  
Protected by: `protect` + `authorize(PERMISSIONS.ADMISSION_VIEW)`

- `ADMISSION_VIEW` is only granted to: super_admin, admin, clerk
- Teacher, student, parent do NOT have this permission → **403**
- Documents are streamed after role check — not served statically

---

## Summary

| Security Property | Status |
|------------------|--------|
| No public static file serving of private uploads | ✅ |
| Raw `filePath` never exposed in responses | ✅ |
| Student/parent blocked from web download endpoint | ✅ |
| Admin/teacher download protected by school scope | ✅ |
| Path traversal blocked (`..` detection) | ✅ |
| Admission documents require `ADMISSION_VIEW` | ✅ |

**Verdict: SECURE** — No file path exposure or unauthorized download path found.
