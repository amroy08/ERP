# Parent Academics Redesign Plan

## Screen Name
`ParentAcademicsScreen`

## Current Purpose
Serves as the central academic hub for parents, containing sub-tabs for Timetable, Homework, Exams schedule, and Exam Results.

## Primary Parent Goal
Monitor their child's academic schedules, check upcoming exams, review homework tasks (and grades/feedback), and follow grades/performance.

## The Current Issue
- Custom pill switcher for children does not conform to the new `ChildContextHeader` design.
- Main tab bar uses default/rough buttons with thin border indicators.
- Sub-tab specifics:
  - **Timetable**: Basic day picker and simple card listings.
  - **Homework**: Basic priority header and plain status text tags.
  - **Exams**: Uses a textual date list with low contrast.
  - **Results**: Basic subject rows with raw percentages and simple green/yellow/red progress bars.

## The Architectural Fix
- Standardize the child context switcher with `ChildContextHeader`.
- Style the tab control to match the segmented control design system (`colors.surfaceSoft` background and floating active tab accent).
- TIMETABLE: Use `TodayScheduleCard` to render periods. Customize the weekday selector scroll bar.
- HOMEWORK: Improve task detail collapsibility using `LayoutAnimation` and show status/grades clearly.
- EXAMS: Render exam cards with graphical calendar badges.
- RESULTS: Use HSL themed progress bars and grades markers.

## The Visual Polish
- Segments: Rounded tab selector with active shadow effects.
- Timetable tab: Clean vertical agenda lines.
- Homework tab: Clear status badges (`pending` warning badge, `submitted` or `graded` success/info badges). Detail cards expanded with clean text layouts for teacher comments.
- Exams tab: Compact grid card displaying subject, total marks, time, and days left indicator.
- Results tab: Elegant progress bar representing the percentage obtained with matching letter grades.

## Interaction / Animation Recommendation
- Smooth transitions when toggling academic sub-tabs.
- LayoutAnimation on homework card expand/collapse.

## Expected Files To Change
- `mobile/src/screens/parent/ParentAcademicsScreen.tsx`

## Risk Level
Medium-Low (Complex tab structure, but logic/API integration is preserved).

## Validation Needed
- Ensure correct data loads for each child and tab.
- Test day switching on Timetable tab.
- Test homework expand/collapse.
- Verify result percentages and grades are mapped correctly.
