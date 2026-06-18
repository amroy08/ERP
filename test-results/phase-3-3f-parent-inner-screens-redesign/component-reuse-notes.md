# Component Reuse Notes — Phase 3.3F

## Reuse Audit
- **`ScreenContainer`**: Reused across all 4 parent screens to manage margins and native device safe area boundaries.
- **`AppCard`**: Reused for timetables, homework cards, invoice lists, and notice cards.
- **`TodayScheduleCard`**: Reused inside `ParentAcademicsScreen` (Timetable tab) to display child schedules.
- **`ChildContextHeader`**: Reused inside `ParentAcademicsScreen` to switch selected children seamlessly.
- **`StatusBadge`**: Reused for attendance records, homework status filters, invoice status tags, and notice priority categories.
- **`MetricCard`**: Reused inside `ParentAttendanceScreen` for Present, Absent, Late, and Rate summary blocks.
- **`EmptyState`**: Reused for empty lists across all tabs and screens.
- **`ErrorState`**: Reused to handle request and API failure scenarios.

## Shared Parent Components
- **`ParentScreenHeader`**: Custom header component created under `mobile/src/components/parent/` specifically for parent role inner screens with custom back buttons, subheaders, and badge status counters.
