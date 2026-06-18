# Teacher Dashboard Redesign Notes

## Changes Applied
- Replaced the basic header with `<DashboardHero>` displaying greeting, teacher name, school name, and a "TEACHER" badge over a violet/pink gradient.
- Added `<MetricCard>` row mapping critical stats:
  - **Classes Today**: link to TeacherTimetable
  - **Pending Attd**: link to TeacherAttendance (shows warning color when there is pending work)
  - **My Students**: total teacher student count
- Added `<QuickActionButton>` grid containing primary action shortcuts:
  - Take Attendance
  - Assign Homework
  - Enter Marks
  - School Notices
- Replaced the generic timetable list with `<TodayScheduleCard>` components detailing periods, subjects, times, classes, and sections.
- Created warning alerts card for pending attendance items with "Mark Now" badge.
- Placed clean padding wrappers and unified styles utilizing constants from `colors.ts`, `layout.ts`, `typography.ts`, and `shadows.ts`.

## UI Verification
- Violet/pink styling matches premium theme design.
- Pull-to-refresh correctly reloads data via `RefreshControl`.
- Loading, error, and empty states fully functional.
