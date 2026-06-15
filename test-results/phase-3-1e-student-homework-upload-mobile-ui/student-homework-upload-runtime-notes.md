# Student Homework Upload Runtime Notes - Phase 3.1E

## Runtime Flows Checked
1. **Initial State Verification**:
   - Logged in as student `student@school.com` / `Admin@123`.
   - Fetched homework list. Assignments returned with status `pending`.

2. **Submission Mechanics**:
   - Opened Submit Homework modal.
   - Text-only submission succeeded.
   - File-only submission successfully picked a `.txt` file and submitted it.
   - Text + File submission combined both parameters inside a single `FormData` payload and sent it to `POST /api/mobile/student/homework/:homeworkId/submit`.

3. **Status Updates**:
   - The card badge updated instantly to reflecting the submission status (e.g. `submitted` or `late`).
   - Re-opening the card details displays inline submission specifics (uploaded file names, text answer, submission timestamp).

4. **Resubmission Flow**:
   - Since the homework was not yet graded/reviewed, the "Resubmit" option remained active.
   - Resubmitted a new file; verified that the old file is deleted and replaced with the new one.
