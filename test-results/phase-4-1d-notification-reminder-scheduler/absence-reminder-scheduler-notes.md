# Absence Reminder Scheduler Notes

## Detection Logic

- Scans active students.
- Obtains the threshold settings from `NotificationRule` for `ATTENDANCE_ABSENCE_ALERT` (default: 3 absences in 7 days).
- Queries `Attendance` table for status `absent` within the calculated dates window (e.g., today at 23:59:59.999 down to `thresholdDays` days ago at 00:00:00.000).
- If the count of absences meets or exceeds `thresholdCount`, the condition is met (`thresholdMet`).
- If the parent user is valid and active, it checks the rule's `cooldownHours` (default: 24h).
- If cooldown allows, it triggers the warning via `NotificationService.notifyAttendanceAbsent()` passing the latest absent record.
- Stalls duplicate warnings for 24 hours.
