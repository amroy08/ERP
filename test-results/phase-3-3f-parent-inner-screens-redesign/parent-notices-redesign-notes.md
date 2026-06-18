# Parent Notices Redesign Notes

## Changes Applied
- Replaced the generic announcements page with a premium bulletin board layout.
- Added the `ParentScreenHeader` component showing an active count of priority circulars.
- Structured circular components to display:
  - Title and priority status badges (Urgent, High, Normal).
  - Date published and target audience filters.
  - Interactive expand/collapse behavior to read full notice descriptions inline without switching views.
- Implemented soft indicators highlighting active notices.

## Intentionally Left Unchanged
- Scoped notice database querying and role-based filters.
