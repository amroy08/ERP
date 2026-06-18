# Component Reuse Plan

To maintain design consistency and prevent code duplication, the dashboard redesigns will prioritize the reuse of established components and constants from Phase 3.3B.

## Reused Components (Phase 3.3B Foundation)

- **`ScreenContainer`**: Standard safe area backdrop wrapper.
- **`AppCard`**: Primary cards for dashboard blocks.
- **`AppButton`**: Action buttons (e.g. "Mark Now" or "Sign Out").
- **`StatusBadge`**: Displaying priority levels (urgent, medium, low) or role tags.
- **`EmptyState` & `ErrorState`**: Standard empty/error handlers.
- **`SectionHeader`**: Clean headers for screen listings.
- **`AppIcon`**: Rendering vector Ionicons.

---

## Proposed Dashboard-Specific Sub-components

To cleanly modularize the home screens, we propose creating these new sub-components under `mobile/src/components/` (or locally within screens) during Phase 3.3C:

### 1. `DashboardHero`
- Renders a curved background banner with a linear gradient accent matching the user role, displaying user greetings, profile roles, and date indicators.

### 2. `QuickActionGrid` (Teacher & Parent)
- Grid layout containing action items with vector icons and status indicators (e.g., Take Attendance, Enter Marks, Assign Homework).

### 3. `MetricCard`
- Compact statistic cards for dashboard summaries (e.g. Days Present, Attendance Percentage, Fee Due).

### 4. `TodayScheduleCard`
- Clean vertical timeline card displaying time intervals, subject titles, and teacher/period details.

### 5. `ChildContextHeader` (Parent)
- Horizontal avatar row representing linked children profiles, enabling tab context switching.

### 6. `NoticePreviewCard`
- Redesigned card layouts displaying notices with priority status badges and calendar date stamps.
