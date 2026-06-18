# Teacher Dashboard Redesign Plan

## Screen Name
- `TeacherHomeScreen` ([TeacherHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/teacher/TeacherHomeScreen.tsx))

## Current Purpose
- Displays today's schedule, pending attendances, quick summary statistics, upcoming exams, and notices to school teachers.

## Primary User Goal
- Quickly check daily timetable classes and execute core management tasks (marking attendance, entering marks, posting homework).

## The Current Issue
- The layout is a plain scrollable list of text metrics. The top header greeting is simple, navigation to actual task screens is indirect, and warning alerts feel like basic warnings instead of highly interactive action cards.

## The Architectural Fix
- Upgrade [TeacherHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/teacher/TeacherHomeScreen.tsx) to consume design system elements like `AppCard`, `AppButton`, `SectionHeader`, and helper cards without altering underlying state logic or mobile API fetching functions.

## The Visual Polish
- **Action-Oriented Grid**: Add quick action cards for "Take Attendance", "Assign Homework", "Enter Marks", and "Write Notices" using clean vector icons and colors.
- **Header Block Upgrade**: Redesign greeting with a curved colored background banner utilizing `gradients.heroTeacher` and `colors.teacher`.
- **Today's Classes Layout**: Display active timeline class boxes with bold time slots, progress bars, or indicators.

## Interaction / Animation Recommendation
- Animate active pending action cards with pulsing status rings (using opacity toggles) to draw direct attention to incomplete attendances.

## Files Expected To Change
- [TeacherHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/teacher/TeacherHomeScreen.tsx)

## Risk Level
- Low

## Validation Needed
- Pull-to-refresh execution.
- Tab bar routing check.
- Verification that no API endpoint payloads or typescript state properties are altered.
