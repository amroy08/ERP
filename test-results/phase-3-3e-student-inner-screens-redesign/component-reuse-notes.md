# Component Reuse Notes — Phase 3.3E

## Reuse Audit
- **`ScreenContainer`**: Reused across all 3 student screens to handle safe-area padding.
- **`AppCard`**: Reused for timetables list, homework files, and exam scores layouts.
- **`TodayScheduleCard`**: Reused inside `StudentTimetableScreen` to display class listings exactly matching the dashboard components.
- **`StatusBadge`**: Reused for homework status displays and student result grades.
- **`EmptyState`**: Reused for blank schedules, pending assignments, or results.
- **`ErrorState`**: Reused to handle failed fetch responses.

## Shared Student Components
- **`StudentScreenHeader`**: New header component created specifically for student theme aesthetics.
