# Teacher Timetable Screen – Redesign Plan

## Screen Name
`TeacherTimetableScreen.tsx`

## Current Purpose
Displays the teacher's weekly timetable grouped by day. Teacher can switch between weekday tabs to see their periods for each day. Today's tab is auto-selected on load.

## Primary Teacher Goal
Quickly understand their schedule for any day of the week at a glance.

## Current UI Issues
1. Page title uses raw `fontSize: 22, fontWeight: '800'` — no design token.
2. Day tab row uses `Text` components as buttons — not `TouchableOpacity` styled pills.
3. Today highlight is a faint `borderColor: colors.teacher + '55'` — too subtle.
4. Period cards use ad-hoc `entryRow` layout with a `timeLine` divider that looks unpolished.
5. `period pill` uses `backgroundColor: colors.teacher + '22'` with fontSize 10 — inconsistent with `StatusBadge`.
6. No header showing today's date or total periods count.
7. No visual differentiation between current/upcoming/past periods.
8. Style sheet values use raw pixel integers.

## Architectural Fix
- Replace raw style values with `typography.*`, `spacing.*`, `radii.*` tokens throughout.
- Replace `Text` day tabs with `TouchableOpacity` pill components with proper `activeOpacity`.
- Reuse `TodayScheduleCard` component from Phase 3.3C dashboard components for each period row.
- Replace period pill with `StatusBadge label={"P" + entry.period} type="info"`.

## Visual Polish
- **Screen Header**: `TeacherScreenHeader` showing "My Timetable" + today's formatted date + total periods count badge for the active day.
- **Day Tab Strip**: Horizontal `ScrollView` of pill `TouchableOpacity` tabs with:
  - Active day: solid `colors.teacher` background, white text
  - Today (not active): `colors.teacher + '20'` background, `colors.teacher` text, dot marker
  - Inactive: `colors.surface` background, `colors.mutedText` text
  - Minimum 3-char label (Mon/Tue/Wed etc.)
- **Period Cards**: Use `TodayScheduleCard` from the Phase 3.3C dashboard component library — period label, subject name, time range, class–section subtext, role colour `colors.teacher`.
- **Today Indicator**: When `activeDay === todayName()`, show a soft violet banner above the list: "Today's Schedule — N periods".
- **Empty State**: `EmptyState` with `emoji="📅"` + custom subtitle per day.

## Interaction / Animation Recommendation
- Tab switch: `ScrollView` snaps the newly active tab to center view using `scrollTo` ref.
- Period card subtle left-border accent using `colors.teacher` (3px left border via borderLeftWidth).
- Loading spinner in violet (`tintColor={colors.teacher}`).

## Expected Files To Change
- `mobile/src/screens/teacher/TeacherTimetableScreen.tsx` — full redesign
- `mobile/src/components/teacher/TeacherScreenHeader.tsx` — reuse/create

## APIs Used (Unchanged)
- `fetchTeacherTimetable()` — returns `{ days: [{ day, periods: [] }] }`

## Risk Level
**Low** — Display-only screen. No form submission, no navigation side effects. State is limited to `activeDay` string.

## Validation Needed
- Timetable loads and groups by day correctly.
- Today's tab is auto-selected on mount.
- Day switching updates the periods list correctly.
- Each period card shows period number, subject, time, class–section.
- Empty day shows EmptyState.
- Pull-to-refresh reloads data.
- No visual overflow on any day.
