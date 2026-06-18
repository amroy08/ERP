# Teacher Notices Screen – Redesign Plan

## Screen Name
`TeacherNoticesScreen.tsx`

## Current Purpose
Displays all school notices relevant to the teacher. Each notice card shows title, publish date, target audience, and a priority badge. Cards are tap-expandable to reveal the full notice content. Teacher role is read-only (no create functionality in this screen).

## Primary Teacher Goal
Stay informed about school announcements and read full notice content when needed.

## Current UI Issues
1. Page title uses raw `fontSize: 22, fontWeight: '800'` — no design token.
2. `tapHint` italic text ("Tap to read ↓") is visually weak — small font, easily missed.
3. Notice content expand animation is instant — no transition, feels abrupt.
4. `card` margin is only 10px with no visual emphasis on urgency levels.
5. `urgent` and `high` notices not visually distinguished by card border.
6. No count or summary of total notices at top.
7. `targetAudience` metadata is `mutedText` and blends with date — needs separation.
8. Style values use raw pixel integers throughout.

## Architectural Fix
- Replace raw style values with typography/spacing/radii tokens throughout.
- Introduce priority-based card border: `urgent` → `borderColor: colors.danger`, `high` → `borderColor: colors.warning`, else → default.
- Replace ad-hoc `tapHint` with a more visible Ionicons chevron icon (`chevron-down` / `chevron-up`).
- Replace expanded content raw `Text` with `typography.body` styled view.

## Visual Polish
- **Screen Header**: `TeacherScreenHeader` showing "School Notices" + notice count badge.
- **Notice Cards** (`TeacherNoticeBulletinCard`):
  - Priority-coloured left border accent (3px): `urgent` = danger, `high` = warning, else = info
  - Title `typography.label` bold on top row
  - Right: `StatusBadge label={priority} type={priorityType(p)}`
  - Below title: date `typography.captionSmall` + `|` separator + target audience chip `StatusBadge label={audience} type="info"`
  - Expanded content: `typography.body` with `lineHeight: 22`, soft `colors.surfaceSoft` background inset
  - Expand/collapse indicator: Ionicons `chevron-down` / `chevron-up` in muted colour, bottom-right
- **Urgent Banner**: If any notices have `priority === 'urgent'`, show a sticky top banner: "⚠️ N Urgent Notice(s) — tap to read" in a `colors.dangerSoft` card.
- **Empty State**: `EmptyState emoji="📢"` + "No notices available at this time."
- **Loading**: `ActivityIndicator` with `colors.teacher` tint + loading text.

## Interaction / Animation Recommendation
- Expand/collapse: `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` before `setExpanded`.
- Urgent banner pulses with a gentle 2s opacity loop `Animated.loop` to draw attention.
- Card shadow upgrades to `shadows.md` on expanded state.

## Expected Files To Change
- `mobile/src/screens/teacher/TeacherNoticesScreen.tsx` — full redesign
- `mobile/src/components/teacher/TeacherNoticeBulletinCard.tsx` — new component
- `mobile/src/components/teacher/TeacherScreenHeader.tsx` — reuse/create

## APIs Used (Unchanged)
- `fetchTeacherNotices()` — returns `Notice[]` with `{ id, title, content, priority, publishDate, targetAudience? }`

## Risk Level
**Low** — Read-only screen. No form submission. Only `expanded` state toggled locally. No navigation side effects.

## Validation Needed
- Notices load and render correctly.
- `urgent` and `high` notices show priority-coloured border accent.
- Tapping a card expands/collapses content smoothly.
- Urgent banner appears when urgents exist.
- Pull-to-refresh reloads notices.
- Empty state renders when no notices.
- Content text wraps correctly without overflow.
