# Parent Notices Redesign Plan

## Screen Name
`ParentNoticesScreen`

## Current Purpose
Displays school announcements and circulars targeted at parent roles.

## Primary Parent Goal
Stay informed about school policies, events, urgent alerts, and child-specific academic notices.

## The Current Issue
- Standard layout with raw headers.
- Card items use simple borders and basic expandable textual content.
- Tap hints and status badges look simple.

## The Architectural Fix
- Use `ParentScreenHeader` with notices counter badge.
- Keep the `fetchParentNotices` API integration intact, matching the notice list structure.
- Reuse `NoticePreviewCard` styles or direct custom implementations optimized for detail views.

## The Visual Polish
- Screen Header: Renders title "School Notices" with a megaphone badge representing the count of unread or urgent announcements.
- Notice Cards:
  - Bullet-styled title and metadata line (Date, Target Audience).
  - Use `StatusBadge` for notice priority: urgent (danger), high (warning), normal (info).
  - Elegant notice content box with proper line-height and margin spacing.
  - Interactive "Tap to read more" / "Tap to collapse" hint styled in small, muted typography with an expanding arrow chevron.

## Interaction / Animation Recommendation
- LayoutAnimation for expand/collapse transition.
- Subtle rotation on chevron arrow when notice expands.

## Expected Files To Change
- `mobile/src/screens/parent/ParentNoticesScreen.tsx`

## Risk Level
Low.

## Validation Needed
- Verify notices list loads correctly.
- Test expand/collapse states.
- Ensure correct mapping of priority badges.
