# Attendance Absence Trigger Notes

## Triggers
- When attendance is submitted/marked via web console (`moduleController.markAttendance`).
- When teacher attendance is submitted via mobile teacher dashboard (`mobileController.submitTeacherAttendance`).

## Recipients
- Target: Parent linked to the absent student only. Students do not receive this alert.

## Notification Configuration
- Type: `ATTENDANCE_ABSENCE_ALERT`
- Priority: `HIGH`
- Related Entity: `attendance` (ID = specific student's attendance record ID).

## Threshold and Cooldown Rules
- Evaluates the school's `ATTENDANCE_ABSENCE_ALERT` rule settings (defaulting to 3 absences in 7 days).
- Fetches all historical student absences within the window and validates that the count crosses the threshold.
- Runs `shouldSendReminder` with student-wide `relatedEntityId: null` check, preventing spamming parent multiple times on the same day if they cross threshold multiple times.
