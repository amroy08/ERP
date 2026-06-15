# Student Homework Response Notes - Phase 3.1D

## Student Homework Endpoint Enhancement
The `GET /api/mobile/student/homework` endpoint has been updated to include submission status and metadata, ensuring compatibility with the mobile application while introducing:
- `submissionStatus`: String ('submitted', 'late', 'overdue', 'pending', 'reviewed', 'returned')
- `submittedAt`: ISO timestamp of submission or `null`
- `hasSubmission`: Boolean indicating whether student has submitted this assignment
- `fileName`: Optional name of the submitted file
- `teacherFeedback`: Optional feedback text from the grading teacher
- `marks`: Optional numeric marks assigned
- `canSubmit`: Boolean indicating if the student is currently allowed to submit/resubmit
- `canResubmit`: Boolean indicating if resubmission is allowed (blocked if reviewed, allowed if returned or not yet graded)

## Student Single Submission Details
The `GET /api/mobile/student/homework/:homeworkId/submission` endpoint returns:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "homeworkId": "homework-uuid",
    "studentId": "student-uuid",
    "status": "submitted",
    "submissionText": "Some text answers",
    "fileName": "algebra_answers.txt",
    "mimeType": "text/plain",
    "fileSize": 12345,
    "submittedAt": "2026-06-15T12:00:00.000Z",
    "teacherFeedback": null,
    "marks": null,
    "reviewedAt": null,
    "canResubmit": true
  }
}
```
If no submission exists, `data` is returned as `null` with status `200 OK`.
