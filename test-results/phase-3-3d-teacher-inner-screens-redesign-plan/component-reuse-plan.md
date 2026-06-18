# Component Reuse Plan – Phase 3.3D Teacher Inner Screens

## Phase 3.3B Base Components — Reused As-Is

| Component | How Used in Phase 3.3D |
|---|---|
| `ScreenContainer` | Outer wrapper on every screen |
| `AppCard` | Card surface for class cards, exam cards, subject cards, student rows |
| `AppButton` | Submit Attendance, Save Marks, Cancel, Review Submissions CTAs |
| `AppInput` | Score entry field in marks screen; max marks field |
| `AppIcon` | Ionicons wrapper for icons in custom components |
| `SectionHeader` | Section dividers within long scrollable views |
| `StatusBadge` | Class badges, priority badges, exam status badges, audience badges |
| `EmptyState` | Empty class list, empty timetable day, empty homework list, empty exam list, empty notices |
| `ErrorState` | Error retry card on all 5 screens |

## Phase 3.3C Dashboard Components — Reused As-Is

| Component | How Used in Phase 3.3D |
|---|---|
| `TodayScheduleCard` | Timetable period cards — reused directly with `roleColor={colors.teacher}` |
| `NoticePreviewCard` | May be used in TeacherNoticesScreen for collapsed view; TeacherNoticeBulletinCard extends its pattern |

## New Teacher-Specific Components — To Create in Phase 3.3D

| Component | File Path | Purpose |
|---|---|---|
| `TeacherScreenHeader` | `mobile/src/components/teacher/TeacherScreenHeader.tsx` | Shared compact page header with optional back action, title, subtitle, and date/count badge |
| `AttendanceClassCard` | `mobile/src/components/teacher/AttendanceClassCard.tsx` | Class selector card with Done/Pending StatusBadge, student count |
| `StudentAttendanceRow` | `mobile/src/components/teacher/StudentAttendanceRow.tsx` | Student row with 3-segment pill toggle (Present/Absent/Late) using Ionicons |
| `AttendanceSummaryBar` | `mobile/src/components/teacher/AttendanceSummaryBar.tsx` | Live count summary bar pinned above Submit: Present / Absent / Late / Total |
| `HomeworkManagementCard` | `mobile/src/components/teacher/HomeworkManagementCard.tsx` | Homework item card with stats grid, pending highlight, due date, review CTA |
| `MarksExamCard` | `mobile/src/components/teacher/MarksExamCard.tsx` | Exam card with stats strip, progress bar, status badge |
| `MarksSubjectCard` | `mobile/src/components/teacher/MarksSubjectCard.tsx` | Subject card with graded/total progress bar |
| `StudentMarksRow` | `mobile/src/components/teacher/StudentMarksRow.tsx` | Student marks entry row inside AppCard with score + remarks inputs |
| `TeacherNoticeBulletinCard` | `mobile/src/components/teacher/TeacherNoticeBulletinCard.tsx` | Notice card with priority left-border, expand/collapse, audience badge, content reveal |

## Component Architecture Principles
- All new components import design tokens from `../../constants/` (colors, layout, typography, shadows).
- All new components use `AppCard` as their base surface.
- All new components use `Ionicons` (not emojis) for icons.
- All new components accept `roleColor?: string` defaulting to `colors.teacher` for easy reuse.
- All components handle null/undefined props gracefully (optional chaining, fallbacks).
- No inline styles — all use `StyleSheet.create` with token values.
- No hardcoded pixel values — spacing/radii tokens only.

## What Will NOT Be Created
- No generic "TeacherCard" that duplicates `AppCard`
- No new button component (use `AppButton` with variant)
- No new icon component (use `AppIcon`)
- No new loading spinner (use `ActivityIndicator` with `colors.teacher`)
