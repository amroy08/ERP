# Parent Dashboard Redesign Plan

## Screen Name
- `ParentHomeScreen` ([ParentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentHomeScreen.tsx))

## Current Purpose
- Displays linked child profile details (attendance, class details), upcoming exams, pending fees, and notices to parents.

## Primary User Goal
- Monitor child status metrics (attendance, grades) and check/pay outstanding school fees.

## The Current Issue
- Standard list presentation. Multiple linked children are displayed as simple cards stacked on top of each other, making it hard to see child-specific dashboard contents. Dues look like basic boxes instead of active quick-pay gateways.

## The Architectural Fix
- Refactor [ParentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentHomeScreen.tsx) to build child-status cards, integrating child switcher headers to dynamically toggle the active children context if multiple children exist, without altering child models.

## The Visual Polish
- **Active Child Visual Banner**: Create a curated visual hero banner block for the selected child.
- **Child Switcher**: Clean selector pills to toggle children.
- **Status Cards**: Clear modular blocks for Attendance percentage, Homework completed count, Fee dues, and Exam summaries using parent accents.

## Interaction / Animation Recommendation
- Animate child-context transitions (swapping visual details) with smooth fade-in animations on tab changes.

## Files Expected To Change
- [ParentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentHomeScreen.tsx)

## Risk Level
- Low to Medium (depending on multiple children dataset structures)

## Validation Needed
- Test dashboard rendering with single child accounts vs accounts with multiple linked children profiles.
- Confirm fee badges match child allocations correctly.
