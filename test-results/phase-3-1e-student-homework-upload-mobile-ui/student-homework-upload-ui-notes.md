# Student Homework Upload UI Notes - Phase 3.1E

## UI Component Layout & Specifications

### 1. Student Homework Screen
- Displays the homework cards with `submissionStatus` badge indicators matching standard alert colors (success for submitted, danger/warning for overdue/late).
- Expanding the card reveals inline submission details including status, file name, timestamp, and teacher grading details (marks, feedback).
- Action buttons are context-aware:
  - **Submit Homework**: Active when `hasSubmission` is false and `canSubmit` is true.
  - **View Submission**: Active when `hasSubmission` is true. Fetches submission details dynamically from the backend API.
  - **Resubmit**: Active when `canResubmit` is true.
  - **Resubmit Locked**: Replaces the resubmit button when the submission is already reviewed.

### 2. Homework Submission Modal
- Titled "Submit Homework" with the homework's name and due date.
- Text input for description or textual response.
- File picker button supporting Expo document selector.
- File attachment preview with a remove button.
- User validations:
  - Validates that at least text or file is provided.
  - Warns the user about file extensions: "PDF, DOC, DOCX, JPG, JPEG, PNG, TXT up to 10MB".
  - Shows activity indicator during the request transfer.
