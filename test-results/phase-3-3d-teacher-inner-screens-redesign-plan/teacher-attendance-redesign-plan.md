# Teacher Attendance Screen – Redesign Plan

## Screen Name
`TeacherAttendanceScreen.tsx`

## Current Purpose
Allows teacher to mark attendance for their assigned classes/sections. Two-view flow:
1. **Class List View**: Shows all teacher-assigned classes for today with Done/Pending status.
2. **Student Marking View**: Shows all students in a selected class; teacher toggles each student between Present/Absent/Late, then submits.

## Primary Teacher Goal
Mark today's class attendance quickly and accurately for all students.

## Current UI Issues
1. Page title/date uses raw `fontSize` integers — no design token usage.
2. Back button is a plain `Text` component with `← Back` — no Ionicons, no touch affordance.
3. Summary chips use `Text` as a badge — not `StatusBadge` or design token components.
4. Submit button is raw `TouchableOpacity` with ad-hoc background colour — not `AppButton`.
5. `tapHint` instruction italic text is hard to notice — easily missed by teachers.
6. Class list lacks visual weight differentiation between "Done" and "Pending" classes.
7. No "Mark All Present" quick action.
8. No total student count chip in the marking header.
9. Status circle uses emoji (✅/❌/⚠️) — inconsistent with Ionicons design system.
10. Style values use raw pixel integers, not spacing/radii constants.

## Architectural Fix
- Replace raw `fontSize: 22, fontWeight: '800'` with `typography.headingLarge` token.
- Replace `← Back` `Text` with Ionicons `arrow-back` inside an `AppButton secondary` or styled `TouchableOpacity`.
- Replace ad-hoc submit `TouchableOpacity` with `AppButton variant="teacher"`.
- Replace emoji status indicators in the status circle with `Ionicons` (`checkmark-circle`, `close-circle`, `time`).
- Replace summary chip `Text` components with `StatusBadge`-styled `View`+`Text` using design tokens.
- Use `spacing.*` and `radii.*` throughout StyleSheet.

## Visual Polish
- **Class List Header**: Add `TeacherScreenHeader` with title "Mark Attendance", formatted today's date, and violet accent line.
- **Class Cards**: Use `AppCard` with `borderColor = colors.success` tint for Done classes. Add a `StatusBadge label="Done" type="success"` or `StatusBadge label="Pending" type="warning"`.
- **Marking Header**: Replace plain View with a compact gradient bar (violet tint, `colors.teacher + '15'`) showing class name + section + date. Add Ionicons `people-outline` count badge.
- **Student Rows**: Use `StudentAttendanceRow` — student name, admission number, and a **3-segment pill toggle** (Present | Absent | Late) with Ionicons icons and semantic colour fills. Minimum height 56px for thumb accessibility.
- **Summary Bar**: Add sticky `AttendanceSummaryBar` pinned above the Submit button — shows live counts: ✅ Present | ❌ Absent | ⏰ Late | Total.
- **Quick Actions**: Add "Mark All Present" button in the marking header (calls a bulk-set helper function, no new API).
- **Submit Button**: `AppButton gradient` full-width with Ionicons `checkmark-done-outline`.

## Interaction / Animation Recommendation
- Student row tap animates the active segment with a fast 150ms `Animated.timing` colour flash.
- Submit button disables and shows loading spinner while `saving` is true.
- "Mark All Present" pre-selects all students then highlights the submit button briefly.

## Expected Files To Change
- `mobile/src/screens/teacher/TeacherAttendanceScreen.tsx` — full redesign
- `mobile/src/components/teacher/StudentAttendanceRow.tsx` — new component
- `mobile/src/components/teacher/AttendanceSummaryBar.tsx` — new component
- `mobile/src/components/teacher/TeacherScreenHeader.tsx` — new shared component

## APIs Used (Unchanged)
- `GET /mobile/teacher/attendance-classes` — class list
- `GET /mobile/teacher/attendance-students?classId=&date=` — student list
- `POST /mobile/teacher/attendance-submit` — submit payload `{ classId, date, records[] }`

## Risk Level
**Medium** — Two-view state machine. Submit logic must remain exactly as-is. "Mark All Present" is a client-only state mutation.

## Validation Needed
- Class list loads correctly and shows Done/Pending states.
- Tapping a class opens the student marking view.
- All 3 status toggles (Present/Absent/Late) cycle correctly.
- "Mark All Present" sets all students to `present` locally.
- Summary bar counts update live on each toggle.
- Submit sends correct payload and dismisses back to class list.
- Pull-to-refresh reloads class list.
- Empty class list renders EmptyState.
