# Teacher Homework Screen – Redesign Plan

## Screen Name
`TeacherHomeworkScreen.tsx`

## Current Purpose
Displays all homework assignments created by the teacher. Each card shows the assignment title, subject, class/section, submission stats (total/submitted/pending/reviewed), due date, and a "Submissions" button that opens a sub-view (`TeacherHomeworkSubmissionsView`) to review individual student submissions.

## Primary Teacher Goal
Track submission progress across all assigned homework and quickly open the review flow for any pending items.

## Current UI Issues
1. Header title/subtitle use raw font sizes, not typography tokens.
2. `classBadge` text is an ad-hoc styled `Text` component — should use `StatusBadge`.
3. Stats grid uses `colors.surfaceSoft` background with raw padding values — inconsistent with `AppCard` inner patterns.
4. No visual priority for homework items with high pending counts.
5. "Submissions" button does not visually indicate whether there are pending reviews.
6. Due date is styled `colors.danger` always — should be conditional (danger only if past due or due today).
7. No loading or refresh affordance on the stats grid.
8. Sub-view transition is abrupt — no header context on return.
9. FlatList `contentContainerStyle` uses raw paddingHorizontal: 16.

## Architectural Fix
- Replace all raw style values with typography/spacing/radii tokens.
- Replace `classBadge` Text with `StatusBadge label={item.className + ' ' + item.sectionName} type="info"`.
- Replace ad-hoc stats grid `View` with reusable `HomeworkManagementCard` that encapsulates the stats block.
- Compute due date urgency: if `dueDate < today` → `colors.danger`, if `dueDate === today` → `colors.warning`, else → `colors.mutedText`.
- Add pending count highlight: if `item.pendingCount > 0` → show a warning banner chip inside the card.

## Visual Polish
- **Screen Header**: `TeacherScreenHeader` showing "Assigned Homework" + subtitle "Review and grade student submissions".
- **Homework Cards** (`HomeworkManagementCard`):
  - Title bold `typography.headingMedium`, subject `typography.caption` muted
  - Class/section `StatusBadge` top-right
  - Stats grid: 4 metric tiles (Students / Submitted / Pending / Reviewed) with semantic colours
  - Pending highlight banner: shown when `pendingCount > 0` — amber `colors.warning + '15'` with Ionicons `alert-circle-outline`
  - Due date chip: conditional colour logic
  - "Review Submissions" CTA `AppButton variant="teacher"` with Ionicons `eye-outline`
- **Empty State**: `EmptyState emoji="📚"` with subtitle "No homework assigned yet."
- **Submissions Sub-View**: Keep existing `TeacherHomeworkSubmissionsView` — only add a `TeacherScreenHeader` with back button and homework title for context.

## Interaction / Animation Recommendation
- Submissions button press gives a brief 0.2s opacity pulse before navigation.
- Pending badge animates in with a gentle scale (1.0 → 1.05 → 1.0) on mount.

## Expected Files To Change
- `mobile/src/screens/teacher/TeacherHomeworkScreen.tsx` — full redesign (list view polish)
- `mobile/src/components/teacher/HomeworkManagementCard.tsx` — new component
- `mobile/src/components/teacher/TeacherScreenHeader.tsx` — reuse/create
- `mobile/src/screens/teacher/components/TeacherHomeworkSubmissionsView.tsx` — header only, no logic changes

## APIs Used (Unchanged)
- `getTeacherHomework()` — returns `TeacherHomeworkItem[]`
- Submissions sub-view has its own API calls (not in scope of this visual redesign)

## Risk Level
**Low-Medium** — The list view is straightforward. The sub-view interaction (`selectedHomeworkId` state) and `loadHomework(true)` on back are preserved exactly. Only visual layer changes.

## Validation Needed
- Homework list loads and renders all cards.
- Each card shows correct stats (submitted/pending/reviewed counts).
- Pending highlight banner appears when `pendingCount > 0`.
- Due date colour changes correctly based on proximity.
- "Review Submissions" button opens `TeacherHomeworkSubmissionsView`.
- Back from sub-view reloads the homework list.
- Pull-to-refresh reloads list.
- Empty state renders when no homework exists.
