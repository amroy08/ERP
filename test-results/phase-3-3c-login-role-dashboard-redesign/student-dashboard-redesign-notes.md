# Student Dashboard Redesign Notes

## Changes Applied
- Swapped original basic header for `<DashboardHero>` displaying greeting, student name, school name, and a "STUDENT" badge over a green/cyan gradient.
- Added `<MetricCard>` row mapping:
  - **Attendance**: link to StudentTimetable (highlights green when >= 85%, yellow otherwise)
  - **Days Present**: summary ratio of days present/total days
  - **Pending HW**: count of pending homework items, linking to StudentHomework
- Created `Today's Schedule` section utilizing `<TodayScheduleCard>` components detailing periods, subjects, times, and teacher name. Added high quality empty states when no classes are scheduled.
- Added `Pending Homework` section showing pending cards with dynamic date-badge highlights mapping remaining days to due dates.
- Added `Recent Exam Results` section displaying exam names, subject details, scores, and grade text styled with semantic colors.
- Integrated `School Notices` utilizing `<NoticePreviewCard>` with priority status badges.

## UI Verification
- Theme matches green student accents.
- Scrollable list flows seamlessly without overflow issues.
- Pull-to-refresh and empty lists are cleanly verified.
