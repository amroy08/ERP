# Student Homework Redesign Plan

## Screen Name
`StudentHomeworkScreen`

## Current Purpose
Allows students to view homework assignments, check status (Pending, Submitted, Reviewed, Graded, Late, Returned), read descriptions, see submission details (text or file attachment), and submit/resubmit responses using a modal form.

## Primary Student Goal
Identify due assignments, submit text or files for pending tasks, and view grades/feedback on reviewed assignments.

## The Current Issue
- Uses a basic text title with hardcoded margins.
- Uses basic status badges and plain cards without consistent elevations.
- Submission card details are plain text fields inside the expanded card.
- Modal inputs (in `HomeworkSubmissionModal`) use raw TextInput and file cards that look unpolished.

## The Architectural Fix
- Introduce `StudentScreenHeader` with a notice badge of pending assignments.
- Create a reusable `HomeworkTaskCard` or customize existing cards to support clean visual states.
- Re-use `AppButton` and `AppCard` consistently.
- Clean up `HomeworkSubmissionModal` layout to match the premium inputs system.
- Preserve the existing `fetchStudentHomework`, `getStudentHomeworkSubmission`, and `submitStudentHomework` endpoints.

## The Visual Polish
- Standardize status colors: `submitted`/`reviewed`/`graded` as success green, `late`/`overdue` as danger red, `returned` as warning yellow.
- Add an alert banner for pending homework items at the top.
- Style the file selection card with a custom file type icon, name, formatted file size, and clean delete button.
- Make text input answer fields match `AppInput` styling.

## Interaction / Animation Recommendation
- Animate expansion/collapse of the homework cards using `LayoutAnimation` (ease-in-ease-out).
- Disable/enable buttons reactively based on validation of empty text/file selections in the modal.

## Expected Files To Change
- `mobile/src/screens/student/StudentHomeworkScreen.tsx` (Modify)
- `mobile/src/screens/student/components/HomeworkSubmissionModal.tsx` (Modify)

## Risk Level
Medium (Handles document selection, file uploads, and state synchronization post-submission).

## Validation Needed
- Verify list filters (All, Pending, Submitted) show correct items.
- Test modal file picking and text input validation.
- Verify text-only submission, file-only submission, and combined submissions.
- Check reloading submission details upon card expansion.
