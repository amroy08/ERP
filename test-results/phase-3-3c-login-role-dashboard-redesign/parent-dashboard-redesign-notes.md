# Parent Dashboard Redesign Notes

## Changes Applied
- Replaced the layout with `<DashboardHero>` displaying parent name, school name, and a "PARENT" badge over a blue/indigo gradient.
- Added `<ChildContextHeader>` switcher bar below hero which dynamically displays horizontally scrollable child context chips (initials avatar, name, class, and section) when parent has multiple children.
- Filtered metrics and alerts by parent-selected active child using state hooks.
- Configured child-specific `<MetricCard>` grids mapping:
  - **Attendance**: link to ParentAttendance (shows formatted percentage)
  - **Fees Due**: link to ParentFees (shows remaining amount or 'Paid' status)
  - **Homework**: link to ParentAcademics (shows count of pending homework)
  - **Today Periods**: link to ParentAcademics (shows periods scheduled today)
- Added child context summary card showing the current active child name, class, section, and admission number.
- Added `Latest Exam Result` performance summary block for the selected child.
- Added `Upcoming Exams` list with date badges contextual to the active child.
- Added `School Notices` previews contextual to the selected child.

## UI Verification
- Theme uses blue parent highlights.
- Child context switcher is highly interactive and updates all metrics, notices, and exams instantly on tap.
- Gracefully supports parents with a single child (context switcher hidden automatically) and multiple children.
- Pull-to-refresh correctly reloads data via `RefreshControl`.
