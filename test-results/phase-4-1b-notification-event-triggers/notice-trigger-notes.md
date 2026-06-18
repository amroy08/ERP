# Notice Trigger Notes

## Triggers
- When a notice/circular is created via `moduleController.createNotice`.

## Recipients
- Target audience is based on selected role:
  - `teacher` -> all active teachers in school.
  - `student` -> all active students in school.
  - `parent` -> all active parents in school.
  - `all` (or empty) -> all active users in school.

## Notification Configuration
- Type: `NOTICE_POSTED`
- Priority: Dynamic (High/Normal) matching the notice priority input.
- Related Entity: `notice` (ID = newly created notice ID).
