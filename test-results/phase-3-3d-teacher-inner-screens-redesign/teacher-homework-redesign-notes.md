# Teacher Homework Redesign Notes

## Changes Applied
- `TeacherScreenHeader` added with "Assigned Homework" title, subtitle, homework count badge.
- New `HomeworkManagementCard` component encapsulates per-item layout:
  - Title `typography.headingSmall fontWeight 800`
  - Class/section as `StatusBadge type="info"`
  - Subject name in caption
  - Description (max 2 lines)
  - Pending alert banner when `pendingCount > 0`
  - Stats grid: Students / Submitted / Pending / Reviewed with semantic colours
  - Due date with conditional colouring: overdue=danger, today=warning, near=warning, future=muted
  - "Review Submissions" `AppButton variant="teacher"` with `Ionicons eye-outline`
- `FlatList` render pattern preserved.
- `contentContainerStyle` uses `spacing.*` tokens instead of raw values.

## Intentionally Not Changed
- `getTeacherHomework()` API call — unchanged.
- `selectedHomeworkId` state switching to sub-view — unchanged.
- `TeacherHomeworkSubmissionsView` component — not modified (sub-view logic preserved).
- `loadHomework(true)` called on back from sub-view — unchanged.
- `TeacherHomeworkItem` type shape — unchanged.

## Validation Result
- Homework list renders all HomeworkManagementCard items.
- Pending banner visible for items with pendingCount > 0.
- Due date colouring correct.
- "Review Submissions" opens sub-view correctly.
- Back from sub-view refreshes list via `loadHomework(true)`.
- Empty state renders.
- Pull-to-refresh works.
