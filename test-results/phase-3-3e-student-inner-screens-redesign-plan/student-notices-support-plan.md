# Student Notices Support Plan

## Screen Name
None (No standalone screen exists under `mobile/src/screens/student/`).

## Current Purpose
School announcements are displayed directly inside the "School Notices" preview section of the `StudentHomeScreen` dashboard.

## Primary Student Goal
Stay updated with school alerts, exam announcements, and holiday bulletins.

## The Current Issue
- Selecting a notice card on the dashboard calls `navigation.navigate('StudentHome')` which refreshes/maintains the home page view without navigating to a standalone notices reader page.

## The Architectural Fix
- No standalone notice screen will be created in this phase, preserving the dashboard-only preview behavior.
- Ensure that notice lists display correctly using `NoticePreviewCard` with correct styling and layout alignments.

## Expected Files To Change
- None (dashboard-only behavior is maintained).

## Risk Level
Zero.

## Validation Needed
- Verify notices load in chronological order and that the priority badges display correctly.
