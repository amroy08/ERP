# Student Dashboard Redesign Plan

## Screen Name
- `StudentHomeScreen` ([StudentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentHomeScreen.tsx))

## Current Purpose
- Displays attendance metrics, daily classes schedule, pending homework tasks, recent marks results, and school notices to students.

## Primary User Goal
- View class schedule and complete pending items (submitting homework, checking exam scores).

## The Current Issue
- The dashboard is plain text lists. Emojis are used directly in layout lists (e.g. `🎉`, `📚`). The next upcoming class is not highlighted, and results are just simple lists of marks.

## The Architectural Fix
- Refactor [StudentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentHomeScreen.tsx) layout to draw from central constants, using structured sub-components to list schedule items and marks cards.

## The Visual Polish
- **Agenda-Focused Schedule**: Present classes as a clean visual timeline with time bars. Highlight the "Next Class" or "Active Period" dynamically.
- **Top Hero Header**: A student-friendly warm layout using `gradients.heroStudent` and `colors.student`.
- **Homework & Notices Cards**: Replace emoji indicators with vector icons and status badges (`StatusBadge` variants) indicating due dates.

## Interaction / Animation Recommendation
- Highlight today's current class with a subtle border animation or colored gradient highlight.

## Files Expected To Change
- [StudentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentHomeScreen.tsx)

## Risk Level
- Low

## Validation Needed
- Test with empty timetable schedules (e.g., weekends) vs populated academic weeks.
- Verify safe rendering of pending tasks.
