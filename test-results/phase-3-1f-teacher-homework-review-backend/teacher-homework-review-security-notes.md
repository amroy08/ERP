# Teacher Homework Review Security Notes — Phase 3.1F

## Authentication
- All endpoints require valid JWT Bearer token (401 if missing).
- Role must be `teacher` (403 if student, parent, or other role).
- Teacher profile must exist in DB (404 if missing).

## Teacher Homework Authorization (getTeacherHomeworkOrThrow)
Homework is accessible to a teacher if at least ONE of the following is true:

1. **Assigned by teacher**: `homework.assignedById === teacher.id`
2. **Class teacher of section**: teacher is class teacher of `homework.sectionId`
3. **Directly assigned class**: teacher is in `homework.class.teachers` (ClassToTeacher)
4. **Subject teacher for section**: teacher teaches `homework.subjectId` in `homework.sectionId` via SubjectTeacher

If none match: `403 Access Denied` (does not reveal homework existence).

## Teacher Submission Authorization (getTeacherHomeworkSubmissionOrThrow)
- Fetches submission → delegates to homework authorization above.
- If submission not found: `404 Not Found`.
- If teacher not authorized for that homework: `403 Access Denied`.

## IDOR Prevention
- Fabricated homework IDs return 403/404 (not 200 with empty data).
- Fabricated submission IDs return 403/404.
- Student/parent/unauth cannot call any teacher review endpoint (403/401).

## Input Validation
- `marks` must be number >= 0; negative values return `400`.
- `status` must be `reviewed` or `returned`; any other value returns `400`.

## File Download Security
- `filePath` is never included in any JSON response.
- Download endpoint resolves path and checks it starts with `private_uploads/homework-submissions/`.
- Path traversal attempts would resolve outside the base dir and return 403.
- If file does not exist on disk: 404 (not a server error).
- File streamed with `res.download()` using original `fileName`.

## Push Notifications
- On `status: reviewed` or `status: returned`, a non-blocking push is sent to the student.
- Fires via `PushNotificationService.sendToUser(student.userId, ...)`.
- Errors are swallowed (`.catch(() => {})`) — push failure does not fail the review operation.
- Notification is skipped if student has no `userId` (legacy accounts without mobile login).
