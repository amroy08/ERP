# Risk and Validation Plan – Phase 3.3D Teacher Inner Screens

## Risk Matrix

| Screen | Risk Level | Reason |
|---|---|---|
| Teacher Notices | Low | Read-only, simple expand/collapse state |
| Teacher Timetable | Low | Display-only, day-tab state, no form submission |
| Teacher Homework | Low-Medium | Has sub-view navigation, reload on back required |
| Teacher Attendance | Medium | 2-view state machine, form submission, bulk action |
| Teacher Marks | High | 3-level navigation, complex form, keyboard/focus, sticky footer |

---

## Risks by Category

### R1: Form Submission Integrity (High Risk on Attendance + Marks)
- **Risk**: Redesign breaks `submitAttendance()` or `handleSubmit()` payload structure.
- **Mitigation**: API calls and payload shapes must remain byte-for-byte identical. Only the visual wrapper changes. No API call logic is moved or modified. Unit-level code review on submit handlers before committing.

### R2: 3-Level State Machine (High Risk on Marks)
- **Risk**: `selectedExam`, `selectedSubject`, and back-navigation logic breaks.
- **Mitigation**: State variables, their types, and transition logic are preserved exactly. Only render blocks are restyled. Back buttons call the exact same state setters.

### R3: Keyboard Avoidance (Medium Risk on Marks)
- **Risk**: `KeyboardAvoidingView` with `Platform.OS === 'ios' ? 'padding' : undefined` may clip redesigned sticky footer.
- **Mitigation**: Sticky footer z-index, `position: 'absolute'`, and `paddingBottom: 120` on student list content must be preserved. Test on Android emulator with keyboard open.

### R4: Homework Sub-View (Low-Medium Risk)
- **Risk**: `TeacherHomeworkSubmissionsView` mount/unmount pattern (`selectedHomeworkId` state) might be disrupted by component refactoring.
- **Mitigation**: The `if (selectedHomeworkId)` branch and `onBack` callback calling `loadHomework(true)` must remain unchanged. Only the list view layout is modified.

### R5: Toggle Cycle (Low Risk on Attendance)
- **Risk**: 3-way toggle logic `present → absent → late → present` is disrupted.
- **Mitigation**: `toggleStatus()` function is pure and unchanged. Only its render output (student row styling) changes.

### R6: TypeScript Errors (Low Risk)
- **Risk**: New component prop types conflict or are inferred incorrectly.
- **Mitigation**: All new component files will use explicit TypeScript interfaces. Run `npx tsc --noEmit` before committing.

### R7: Expo/LinearGradient (Low Risk)
- **Risk**: `TeacherScreenHeader` may optionally use a subtle gradient banner, requiring `expo-linear-gradient` which is already installed.
- **Mitigation**: `expo-linear-gradient` is already in use (DashboardHero, LoginScreen). No new dependency needed.

---

## Validation Plan

### For Each Screen
| Check | Tool |
|---|---|
| TypeScript compiles cleanly | `npx tsc --noEmit` |
| Screen renders without crash | Android emulator visual test |
| API data populates correctly | Live device with backend running |
| Empty state renders | Verify with no-data state |
| Error state renders | Simulate network failure |
| Pull-to-refresh works | Swipe down gesture on device |

### Teacher Attendance
- [ ] Class list renders with Done/Pending badges
- [ ] Tap class → opens student marking view
- [ ] Student list renders with 3-way toggle
- [ ] Toggle cycles: Present → Absent → Late → Present
- [ ] "Mark All Present" sets all statuses to `present`
- [ ] Summary bar counts update live
- [ ] Submit sends correct payload
- [ ] Success alert dismisses back to class list
- [ ] Error alert shown on submit failure
- [ ] Pull-to-refresh reloads class list

### Teacher Timetable
- [ ] Today's tab auto-selected on mount
- [ ] Day tabs switch correctly
- [ ] TodayScheduleCard renders with correct period/time/subject/class
- [ ] Empty day shows EmptyState
- [ ] Pull-to-refresh reloads timetable

### Teacher Homework
- [ ] Homework list renders all cards
- [ ] Stats grid shows correct counts
- [ ] Pending highlight visible when pendingCount > 0
- [ ] Due date colour logic correct
- [ ] Submissions button opens sub-view
- [ ] Back from sub-view refreshes list
- [ ] Pull-to-refresh works

### Teacher Marks
- [ ] Exam list renders with progress bars
- [ ] Exam card → subject list transition works
- [ ] Subject card → student entry transition works
- [ ] Score inputs pre-filled from API
- [ ] Inline validation shows errors
- [ ] Max marks change re-validates all rows
- [ ] Save Marks sends correct payload
- [ ] Back to Subjects and Back to Exams work
- [ ] Sticky footer visible above keyboard
- [ ] Pull-to-refresh on exam list works

### Teacher Notices
- [ ] Notices list renders
- [ ] Urgent/high cards show priority border
- [ ] Tap to expand/collapse works with animation
- [ ] Urgent banner shows when urgent notices exist
- [ ] Pull-to-refresh reloads notices
- [ ] Empty state renders

---

## Scope Boundary Confirmation

| Boundary | Status |
|---|---|
| No backend API changes | ✅ Confirmed |
| No Prisma schema changes | ✅ Confirmed |
| No web console changes | ✅ Confirmed |
| No student screens modified | ✅ Confirmed |
| No parent screens modified | ✅ Confirmed |
| No TeacherHomeScreen modified | ✅ Confirmed |
| No route names changed | ✅ Confirmed — TeacherAttendance/Timetable/Homework/Marks/Notices names preserved |
| No fake/hardcoded data | ✅ Confirmed |
| AdmissionFormPage.tsx not staged | ✅ Confirmed |
