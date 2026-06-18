# Teacher Timetable Redesign Notes

## Changes Applied
- Replaced raw `fontSize: 22, fontWeight: '800'` title with `TeacherScreenHeader` using `typography.headingLarge`.
- Day tabs replaced from `Text` onPress buttons to `TouchableOpacity` pill components with 3 states:
  - **Active**: solid `colors.teacher` fill, white text
  - **Today (inactive)**: `colors.teacher + '12'` tint, `colors.teacher` text, dot indicator below label
  - **Default**: `colors.surface`, `colors.mutedText` text
- Today context banner added when `activeDay === today` and periods > 0: "Today's Schedule — N periods" with Ionicons `calendar` icon.
- Period cards reuse existing `TodayScheduleCard` from Phase 3.3C dashboard components — no duplication. Props: `period="P{n}"`, `subjectName`, `timeRange`, `subText` (class–section), `roleColor={colors.teacher}`.
- Day abbreviations map: Mon/Tue/Wed/Thu/Fri/Sat.

## Intentionally Not Changed
- `fetchTeacherTimetable()` API call — unchanged.
- Grouped-by-day data transformation — unchanged.
- `activeDay` state and today auto-detection — unchanged.
- `DAY_ORDER` ordering — unchanged.
- Pull-to-refresh with `RefreshControl` — unchanged.

## Validation Result
- Timetable loads and groups by day correctly.
- Today's tab auto-selected on mount.
- Day switching updates period list.
- TodayScheduleCard renders period, subject, time, class–section.
- Empty day shows EmptyState.
- Pull-to-refresh reloads data.
