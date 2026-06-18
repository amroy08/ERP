# Student Timetable Redesign Notes

## Changes Applied
- Replaced the basic text day tabs with custom rounded weekday pill buttons.
- Today's weekday pill gets a prominent bottom dot highlight.
- Added a today's agenda count banner summarizing active classes.
- Used `TodayScheduleCard` for class timetable cells displaying timings, periods, subject, and teacher.
- Handled blank timetable slots using `EmptyState`.

## Intentionally Left Unchanged
- Database queries and `fetchStudentTimetable` APIs.
- Timetable grouping-by-day logic.
