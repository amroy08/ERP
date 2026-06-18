# Phase 3.3D: Teacher Inner Screens Premium Redesign – Implementation Plan

## Status
- **Phase**: PLANNING
- **Branch**: Nupun
- **Starting HEAD**: 5353eb6a3eac83caa0a91166e0b68e0d7d641a76
- **Date**: June 18, 2026
- **Prerequisite**: Phase 3.3C PASS

---

## Goal

Apply the Phase 3.3B design system and Phase 3.3C dashboard visual style to the 5 teacher inner tab screens. The teacher home dashboard (TeacherHomeScreen) is already redesigned and is NOT in scope.

---

## Screens In Scope

| Screen | File | Route Name | Risk |
|---|---|---|---|
| Teacher Attendance | `TeacherAttendanceScreen.tsx` | `TeacherAttendance` | Medium |
| Teacher Timetable | `TeacherTimetableScreen.tsx` | `TeacherTimetable` | Low |
| Teacher Homework | `TeacherHomeworkScreen.tsx` | `TeacherHomework` | Low |
| Teacher Marks | `TeacherMarksScreen.tsx` | `TeacherMarks` | High |
| Teacher Notices | `TeacherNoticesScreen.tsx` | `TeacherNotices` | Low |

---

## Design Foundation Available

### Phase 3.3B Base Components
- `ScreenContainer` — consistent safe-area padding
- `AppCard` — premium card surface with shadow tokens
- `AppButton` — gradient + variant buttons (teacher theme)
- `AppInput` — design-token inputs
- `AppIcon` — Ionicons wrapper
- `SectionHeader` — bold section labels
- `StatusBadge` — semantic role/priority pill badges
- `EmptyState` — illustrated empty list fallback
- `ErrorState` — unified retry error card

### Phase 3.3C Dashboard Components
- `DashboardHero` — gradient hero banner with role badge
- `MetricCard` — stat value + icon tile
- `QuickActionButton` — action grid tile
- `TodayScheduleCard` — period schedule card row
- `NoticePreviewCard` — notice preview with badge

### Design Tokens
- `colors.ts` — `colors.teacher`, `colors.success`, `colors.danger`, `colors.warning`
- `layout.ts` — `spacing.*`, `radii.*`, `sizing.*`
- `typography.ts` — all type scales
- `shadows.ts` — `shadows.sm`, `shadows.md`, `shadows.lg`

---

## New Teacher-Specific Components Proposed

| Component | Purpose | Used By |
|---|---|---|
| `TeacherScreenHeader` | Compact page header with title, date, and optional back button | All 5 screens |
| `AttendanceClassCard` | Class card with Done/Pending status badge | Attendance screen |
| `StudentAttendanceRow` | Student row with 3-way status segmented toggle | Attendance marking |
| `AttendanceSummaryBar` | Live count chips: Present / Absent / Late / Total | Attendance marking |
| `TimetableScheduleCard` | Enhanced period card reusing `TodayScheduleCard` design | Timetable screen |
| `HomeworkManagementCard` | Homework item card with stats grid + review CTA | Homework screen |
| `MarksExamCard` | Exam selection card with date, class, status badge, progress bar | Marks screen |
| `MarksSubjectCard` | Subject selection card with graded/total progress | Marks screen |
| `StudentMarksRow` | Student marks entry row with AppInput + remarks | Marks screen |
| `TeacherNoticeBulletinCard` | Full notice card with expand/collapse, priority badge, audience | Notices screen |

---

## Implementation Order

1. Write `TeacherScreenHeader` component (shared across all 5)
2. Redesign `TeacherNoticesScreen` (lowest risk, read-only)
3. Redesign `TeacherTimetableScreen` (low risk, display-only)
4. Redesign `TeacherHomeworkScreen` (medium risk, has sub-view)
5. Redesign `TeacherAttendanceScreen` (medium risk, has 2 views + submit)
6. Redesign `TeacherMarksScreen` (highest risk, 3-level navigation + form entry)

---

## Scope Boundaries (Hard Constraints)

- No changes to any backend API
- No changes to Prisma schema
- No changes to web console
- No student or parent screens modified
- No teacher home dashboard modified
- No route names changed
- No fake/hardcoded data added
- No EAS build or APK work
- No Admissions form staged

---

## Validation Plan

1. `npx tsc --noEmit` in `/mobile` — PASS required
2. All submit/save flows still functional after redesign
3. Pull-to-refresh on all screens
4. Empty/error states render cleanly
5. Attendance marking flow: class list → student list → submit
6. Marks entry flow: exam list → subject list → student entry → save
7. Homework sub-view still opens on Submissions button tap
8. No visual overflow on Android emulator

---

## Files Expected To Change

### Mobile Source Files
```
mobile/src/screens/teacher/TeacherAttendanceScreen.tsx
mobile/src/screens/teacher/TeacherTimetableScreen.tsx
mobile/src/screens/teacher/TeacherHomeworkScreen.tsx
mobile/src/screens/teacher/TeacherMarksScreen.tsx
mobile/src/screens/teacher/TeacherNoticesScreen.tsx
```

### New Shared Teacher Component (optional, may inline)
```
mobile/src/components/teacher/TeacherScreenHeader.tsx
mobile/src/components/teacher/AttendanceClassCard.tsx
mobile/src/components/teacher/StudentAttendanceRow.tsx
mobile/src/components/teacher/AttendanceSummaryBar.tsx
mobile/src/components/teacher/HomeworkManagementCard.tsx
mobile/src/components/teacher/MarksExamCard.tsx
mobile/src/components/teacher/MarksSubjectCard.tsx
mobile/src/components/teacher/StudentMarksRow.tsx
mobile/src/components/teacher/TeacherNoticeBulletinCard.tsx
```

### Evidence Files
```
test-results/phase-3-3d-teacher-inner-screens-redesign/
```
