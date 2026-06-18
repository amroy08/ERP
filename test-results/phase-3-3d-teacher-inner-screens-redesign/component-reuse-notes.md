# Component Reuse Notes – Phase 3.3D

## Phase 3.3B Components Reused

| Component | Screen | Usage |
|---|---|---|
| `ScreenContainer` | All 5 screens | Outer wrapper for safe-area insets |
| `AppCard` | All 5 screens | Base card surface for class, student, homework, exam, notice cards |
| `AppButton` | Attendance, Homework, Marks | Submit, Cancel, Review Submissions CTAs |
| `StatusBadge` | Attendance, Homework, Marks, Notices | Class badges, exam status, priority badges, Done badges |
| `EmptyState` | All 5 screens | Empty class list, empty day, empty homework, empty exams, empty notices |
| `ErrorState` | All 5 screens | Error retry card |

## Phase 3.3C Dashboard Components Reused

| Component | Screen | Usage |
|---|---|---|
| `TodayScheduleCard` | Timetable | Direct reuse for each period card with `roleColor={colors.teacher}` |

## New Teacher-Specific Components Created

| Component | File | Used By |
|---|---|---|
| `TeacherScreenHeader` | `components/teacher/TeacherScreenHeader.tsx` | All 5 screens, all 3 marks levels |
| `HomeworkManagementCard` | `components/teacher/HomeworkManagementCard.tsx` | TeacherHomeworkScreen |
| `MarksExamCard` | `components/teacher/MarksExamCard.tsx` | TeacherMarksScreen (exam list) |
| `MarksSubjectCard` | `components/teacher/MarksSubjectCard.tsx` | TeacherMarksScreen (subject list) |

## Components Intentionally Not Duplicated
- No new button component — used `AppButton` with `variant="teacher"`.
- No new icon component — used `Ionicons` directly.
- No new loading spinner — used `ActivityIndicator` with `colors.teacher`.
- No new card surface — used `AppCard` as base for all cards.
- No `StudentAttendanceRow` extracted to separate file — inlined within `TeacherAttendanceScreen` for simplicity and to avoid over-componentization.
- No `AttendanceSummaryBar` extracted — inlined in sticky footer for direct access to student state.

## Design Token Compliance
- All new components use `spacing.*`, `radii.*`, `typography.*`, and `shadows.*` tokens.
- No raw pixel values in any new component.
- All colours from `colors.ts` — no hardcoded hex values.
- All Ionicons used (no emoji icons in redesigned screens).
