# Student Timetable Redesign Plan

## Screen Name
`StudentTimetableScreen`

## Current Purpose
Displays the student's class schedule grouped by day of the week (Monday to Saturday), with period numbers, timings, subjects, and teacher names.

## Primary Student Goal
Quickly check their daily schedule, see what class is currently running, and prepare for upcoming classes/periods of the day.

## The Current Issue
- Uses basic text-based scrollable tabs with thin borders.
- Has raw title styling (`fontSize: 22, fontWeight: '800'`).
- The timetable entries look plain, lack visual hierarchy, and use basic inline colors like `colors.student + '22'` for backgrounds without soft shadow effects or modern borders.
- Does not highlight current/active class or today's timetable dynamically in a structured banner.

## The Architectural Fix
- Introduce a reusable `StudentScreenHeader` (similar to `TeacherScreenHeader`) to unify page title, subtitle (today's date in local format), and class count badge.
- Re-use `TodayScheduleCard` (already implemented in Phase 3.3C/D) to represent each class period cleanly, with the period pill, timings, subject name, and teacher.
- Keep the `fetchStudentTimetable` API intact, preserving the grouped-by-day structure.

## The Visual Polish
- Replace basic day tabs with rounded, horizontal pill buttons (using `colors.student` theme styling).
- Color-code the active day pill with full background and white text.
- Highlight "Today" pill tab with a special dot indicator.
- Add an agenda sub-banner highlighting today's schedule at a glance.

## Interaction / Animation Recommendation
- Smooth tap animations on the day tabs.
- Subtle fade-in of the list contents when switching days using standard LayoutAnimation or clean state transitions.

## Expected Files To Change
- `mobile/src/screens/student/StudentTimetableScreen.tsx` (Modify)

## Risk Level
Low (No API changes, only layout/visual updates).

## Validation Needed
- Verify correct timetable data displays for each selected weekday.
- Check day selection styling and today's schedule indicator.
- Verify fallback `EmptyState` when a day has no scheduled classes.
