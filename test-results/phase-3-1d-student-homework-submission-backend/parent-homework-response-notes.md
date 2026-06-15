# Parent Homework Response Notes - Phase 3.1D

## Parent Child Homework Details Enhancement
The `GET /api/mobile/parent/student/:studentId/homework` endpoint has been upgraded to include student submission metadata in child academic data views:
- `submissionStatus`: String ('submitted', 'late', 'overdue', 'pending')
- `submittedAt`: ISO Timestamp of child's homework submission
- `hasSubmission`: Boolean indicating if the child has submitted this homework assignment
- `fileName`: Name of the file submitted by the child (for record-keeping/visibility)
- `teacherFeedback`: Feedback left by the grading teacher
- `marks`: Marks achieved by the child

## Security Isolation
Parents are strictly prohibited from accessing files directly (no download links are exposed in this phase). They can only view the submission metadata for students linked directly to their profile.
If a parent attempts to query an unlinked student ID, the system responds with `403 Access Denied`.
