# Parent Attendance Redesign Plan

## Screen Name
`ParentAttendanceScreen`

## Current Purpose
Displays attendance statistics and recent logs for all children linked to the parent account.

## Primary Parent Goal
Easily track the attendance status, rates, and presence/absence logs of their children to ensure they are attending classes.

## The Current Issue
- Titles and text sizes are styled basic.
- For parents with multiple children, all children's summaries and records are listed sequentially on one page, leading to a long and repetitive scroll.
- Each attendance record (up to 15 days) is wrapped in an individual `AppCard`, cluttering the interface.
- Raw emojis (`✅`, `❌`, `⚠️`) are used instead of styled modern badges.

## The Architectural Fix
- Introduce a client-side switcher using `ChildContextHeader` at the top of the screen (visible if parent has more than one child).
- Use `ParentScreenHeader` at the top with subtitle stating child attendance metrics summary.
- Retrieve all children attendance summaries via `fetchParentAttendance()` (preserving the existing API call).
- Based on the selected child, render their summary statistics and log history.

## The Visual Polish
- Metric Cards Row: Renders four grid items for the selected child:
  - **Present Days**: Styled in clean success color.
  - **Absent Days**: Styled in soft danger red.
  - **Late Days**: Styled in warning amber.
  - **Attendance %**: Bold text with conditional styling (success if >= 85%, warning if < 85%).
- History Log Card: Group all history logs (up to 15 days) in a single card using thin separator lines (`borderBottomWidth: 1, borderBottomColor: colors.borderSoft`) instead of 15 standalone card components.
- Status Badges: Use structured labels with matching background overlays (e.g. `Present` as success-badge, `Absent` as danger-badge, `Late` as warning-badge).

## Interaction / Animation Recommendation
- Use `LayoutAnimation` when toggling between children.
- Smooth card opacity transitions.

## Expected Files To Change
- `mobile/src/screens/parent/ParentAttendanceScreen.tsx`

## Risk Level
Low (UI-only updates, backend endpoint untouched).

## Validation Needed
- Verify list content switches cleanly when changing child selection via `ChildContextHeader`.
- Verify metric computations match the data from `fetchParentAttendance`.
- Verify the layout when no logs or no children exist.
