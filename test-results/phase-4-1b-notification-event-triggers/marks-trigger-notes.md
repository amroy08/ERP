# Marks Trigger Notes

## Triggers
- When marks/results are entered in bulk via `examController.submitMarks`.
- When a single student's mark is saved/updated via inline edit in `examController.saveStudentMark`.

## Recipients
- Target: Student whose result has changed.
- Linked parent.

## Notification Configuration
- Type: `MARKS_POSTED`
- Priority: `NORMAL`
- Related Entity: `result` (ID = specific student's result ID).

## Duplicate Protection
- Uses the `shouldSendReminder` rule check based on `result.id` to prevent spamming students/parents during repeated inline edits or save loops.
