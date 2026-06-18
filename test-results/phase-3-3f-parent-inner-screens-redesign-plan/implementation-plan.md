# Implementation Plan – Phase 3.3F: Parent Inner Screens Premium Redesign

## Goal Description
Redesign the parent role's inner screens to match the premium Phase 3.3B design system, Phase 3.3C dashboard styling, and the same visual language already active on teacher and student screens. This will involve updating Parent Attendance, Academics, Fees, and Notices screens to improve hierarchy, readability, and modern mobile ergonomics.

## User Review Required
No breaking changes or schema updates are introduced. Backend APIs, database structures, routing systems, and non-parent roles are completely untouched.

## Open Questions
- **Child Filtering behavior on Attendance and Fees**: Should we introduce child filtering at the top using the reusable `ChildContextHeader` to isolate stats per-child? 
  *Recommendation*: Yes. Adding `ChildContextHeader` ensures total consistency with the Parent Academics tab and Home Dashboard.

---

## Proposed Changes

### Parent Inner Screens Component & Screen Updates

#### [NEW] [ParentScreenHeader.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/components/parent/ParentScreenHeader.tsx)
- Renders page titles, subtitles, back navigation cues, and alert badges matching the parent theme color accent (`colors.parent`).

#### [MODIFY] [ParentAttendanceScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentAttendanceScreen.tsx)
- Add the unified `ParentScreenHeader` component.
- Integrate `ChildContextHeader` at the top to isolate and view attendance logs per child (client-side filtering of the fetched list).
- Replace individual day cards with a single consolidated timeline card list using vertical line separators and premium status badges.
- Display a 4-column metrics row (Present, Absent, Late, Attendance Rate %).

#### [MODIFY] [ParentAcademicsScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentAcademicsScreen.tsx)
- Standardize child selector using the unified `ChildContextHeader` component.
- Revamp the academic tab switcher with a premium segmented pill bar.
- Timetable Sub-tab: Style daily agenda items with vertical timing blocks and clean status indicators.
- Homework Sub-tab: Style pending alerts, filter pills, and expandable details with layout transitions.
- Exams & Results Sub-tab: Introduce visual calendar badges for upcoming exams and score progress bars for results.

#### [MODIFY] [ParentFeesScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentFeesScreen.tsx)
- Integrate `ParentScreenHeader` and `ChildContextHeader`.
- Redesign the outstanding due banner into a premium hero metric card with gradients.
- Re-style fee ledger cards with modern tabular/row layouts, clean numeric weights, and progress indicators for paid vs due balances.

#### [MODIFY] [ParentNoticesScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentNoticesScreen.tsx)
- Replace custom headers with `ParentScreenHeader`.
- Improve notice list cards with clear typography, status badges, and layout transition animations for collapsible descriptions.

---

## Verification Plan

### Automated Tests
- Run TypeScript validation to ensure all props and type imports compile:
  ```bash
  cd mobile && npx tsc --noEmit
  ```

### Manual Verification
- Verify that switching children via `ChildContextHeader` correctly filters content on Academics, Attendance, and Fees.
- Verify status indicators (e.g. Present vs Absent, Paid vs Due, Notice Priority).
- Verify empty states when data arrays are empty.
