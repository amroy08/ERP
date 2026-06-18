# Teacher Attendance Redesign Notes

## Changes Applied

### Class List View
- `TeacherScreenHeader` added with "Mark Attendance", today date, class count badge.
- AppCard class cards now have:
  - Ionicons `checkmark-circle` (green) for Done, `people-outline` (purple) for pending
  - 32px icon box with `colors.teacher + '12'` background
  - Class name and student count
  - `StatusBadge label="Done" type="success"` for done classes
  - "Mark Now" badge with Ionicons `chevron-forward` for pending classes
  - Green border tint for done, violet border tint for pending
- Pull-to-refresh with `RefreshControl` preserved.

### Student Marking View
- `TeacherScreenHeader` with class–section, today's date, student count badge, back button ("All Classes").
- Quick action bar: "Mark All Present" (green) + "Reset" (muted) buttons as `TouchableOpacity` with Ionicons.
- Per-student AppCard with 3px left border in status colour (green/red/amber).
- **3-segment pill toggle**: 3 squares inline — Present / Absent / Late — each shows relevant Ionicons icon. Active segment gets solid colour fill, inactive shows muted Ionicons on white background.
- Student name and admission number in left column.
- Minimum row height 52px for thumb accessibility.
- **Sticky footer** (position absolute):
  - Summary bar: Ionicons icon + count + label for Present/Absent/Late/Total
  - `AppButton gradient teacher` Submit Attendance with `Ionicons checkmark-done-outline`
- `markAllPresent()` sets all students to `present`.
- `resetAll()` sets all students to `present` (same as mark all present — reset = default state).

## Intentionally Not Changed
- `toggleStatus()` logic (3-cycle: present→absent→late→present) — preserved (via `setStudentStatus` segmented control calls).
- `submitAttendance()` API payload `{ classId, date, records[] }` — unchanged.
- `loadClasses()` and `openClass()` — unchanged.
- Date formatting for API — unchanged.
- `Alert.alert` for success/error — unchanged.

## Validation Result
- Class list loads and shows Done/Pending states correctly.
- Tapping a class opens student marking view.
- All 3 status segment buttons work — active button gets colour fill.
- "Mark All Present" sets all students to present.
- Summary counts update live on each toggle.
- Submit sends correct payload.
- Success alert dismisses back to class list.
- Pull-to-refresh reloads class list.
