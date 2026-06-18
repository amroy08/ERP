# Teacher Notices Redesign Notes

## Changes Applied
- Replaced raw `fontSize: 22, fontWeight: '800'` with `typography.headingLarge` via `TeacherScreenHeader`.
- Added notice count badge to `TeacherScreenHeader`.
- Added urgent banner at top when `priority === 'urgent'` notices exist — uses `colors.dangerSoft` background with Ionicons `alert-circle`.
- Implemented priority-based left border: `danger` for urgent, `warning` for high, `colors.teacher + '40'` for others.
- Replaced italic "Tap to read ↓" text with Ionicons `chevron-down`/`chevron-up` in the right column.
- Added `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` for smooth expand/collapse.
- Expanded content shown in `colors.surfaceSoft` rounded inset box.
- Target audience rendered as a teacher-coloured chip with `captionSmall` text.
- Date and audience now separated visually with `·` separator and distinct chips.
- Expanded card gets `shadows.md` upgrade.

## Intentionally Not Changed
- `fetchTeacherNotices()` API call — unchanged.
- `expanded` state toggling logic — unchanged.
- Notice interface (`id, title, content, priority, publishDate, targetAudience`) — unchanged.
- Pull-to-refresh with `RefreshControl` — unchanged.

## Validation Result
- Notices list renders correctly.
- Priority-coloured left borders visible on all cards.
- Expand/collapse animates smoothly.
- Urgent banner appears for urgent notices.
- Empty state renders with emoji and subtitle.
- Pull-to-refresh triggers reload.
