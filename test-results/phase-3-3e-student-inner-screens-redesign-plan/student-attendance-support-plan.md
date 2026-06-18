# Student Attendance Support Plan

## Screen Name
None (No standalone screen exists under `mobile/src/screens/student/`).

## Current Purpose
Attendance metrics are displayed exclusively on the student home screen dashboard:
- Percentage metric card (e.g. `85%`).
- Days present ratio card (e.g. `24/28`).

## Primary Student Goal
View their cumulative attendance record and understand whether they satisfy the required threshold.

## The Current Issue
- There is no standalone page for details or month-by-month attendance records.
- Selecting the attendance card on the dashboard navigates the student directly to `StudentTimetableScreen` tab rather than a dedicated attendance screen.

## The Architectural Fix
- No code will be written to create a new standalone screen, as the current navigation structure (`StudentNavigator`) does not define a route or menu tab for student attendance.
- The dashboard metrics cards will continue to read from the student dashboard API correctly.
- This phase will focus purely on inner screen redesign of existing screens. No new screens will be added.

## Expected Files To Change
- None.

## Risk Level
Zero.

## Validation Needed
- Ensure dashboard metric calculations match API responses.
