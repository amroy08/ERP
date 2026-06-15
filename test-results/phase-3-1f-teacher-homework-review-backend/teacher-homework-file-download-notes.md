# Teacher Homework Review Secure File Download Notes — Phase 3.1F

## Security Design

The secure file download endpoint is implemented at `GET /api/mobile/teacher/homework/submissions/:submissionId/download`.

### 1. Authentication and Authorization Check
- Every request must provide a valid authorization token.
- The user is validated to have the `teacher` role.
- The teacher's profile is loaded from the database, and we verify that the teacher is authorized to access the specific homework submission (via Class Teacher assignment, direct Class assignment, Subject Teacher section/subject assignment, or creator/assigner ID).

### 2. Path Traversal Prevention
- The backend resolves the base uploads path absolutely using `path.resolve(process.cwd(), 'private_uploads', 'homework-submissions')`.
- The requested file path associated with the submission is resolved absolutely using `path.resolve(submission.filePath)`.
- We explicitly verify that `requestedPath.startsWith(privateBase)` is true. If it is false (which occurs if `..` traversal sequences attempt to escape the base directory), the server returns a `403 Forbidden` response.

### 3. File streaming and MIME type handling
- If the file exists, the server streams the file back with the user's original filename using Express's `res.download(requestedPath, submission.fileName, ...)`.
- If no file is associated with the submission, or if the file does not exist on disk, a `404 Not Found` response is returned.
- Raw file paths (`filePath`) are never leaked to the client in JSON responses (they are omitted from all submission detail and submission list responses).
