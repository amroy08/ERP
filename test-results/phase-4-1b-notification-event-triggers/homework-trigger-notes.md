# Homework Trigger Notes

## Triggers
- When homework is assigned via web console (`moduleController.createHomework`).

## Recipients
- Target: All students in the target class + section.
- Parents linked to those students.

## Notification Configuration
- Type: `HOMEWORK_POSTED`
- Priority: `NORMAL`
- Related Entity: `homework` (ID = newly created homework ID).
