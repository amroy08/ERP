# Exam Trigger Notes

## Triggers
- When an exam is created/scheduled via `examController.createExam`.
- When an exam's schedule/date changes via `examController.updateExam`.

## Recipients
- Target: All students belonging to the exam class.
- Linked parents.

## Notification Configuration
- Type: `EXAM_POSTED`
- Priority: `NORMAL`
- Related Entity: `exam` (ID = target exam ID).
