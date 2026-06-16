# Phase 3.2B — Web Homework Review UI Notes

## Audit Date
2026-06-16

## UI Audit Result: PASS

## Homework List View
- ✅ Loads 3 homework assignments from DB
- ✅ Shows subject badge, section, title, description (truncated), due date, assigned by, ACTIVE/EXPIRED status
- ✅ Admin sees "Assign Homework" button
- ✅ Delete button (trash icon) appears on hover
- ✅ "Submissions" hint + chevron appears on hover for Admin
- ✅ Clicking a card navigates to submissions view

## Submissions List View
- ✅ Stats bar shows: Total (28), Submitted (1), Pending (27), Reviewed (1), Returned (1), Late (0)
- ✅ Stats are color-coded (dark=total, blue=submitted, grey=pending, green=reviewed, purple=returned, amber=late)
- ✅ Filter tabs work: All, Pending, Submitted, Late, Reviewed, Returned
- ✅ Tab shows live count e.g. "RETURNED (1)"
- ✅ Table columns: Student, Status, Submitted, Content, Marks, Reviewed, Actions
- ✅ Student avatar (initial) shown
- ✅ Status badges (PENDING/SUBMITTED/LATE/REVIEWED/RETURNED) with icons
- ✅ Content indicators: TEXT badge (blue), FILE badge (green), or — if none
- ✅ Marks column shows number or —
- ✅ Reviewed date column shows date or —
- ✅ Action button (View/Review) appears on row hover
- ✅ Pending rows show "NOT SUBMITTED" text
- ✅ Breadcrumb navigation (Academics → Homework → Submissions)
- ✅ Back button returns to homework list
- ✅ Refresh button reloads submissions without page reload

## Review Modal
- ✅ Opens when clicking View/Review on a student row with a submission
- ✅ Shows student name, admission/roll number, status badge
- ✅ Shows homework title, subject in coloured info cards
- ✅ Shows submitted date and due date
- ✅ Shows submission text (scrollable, max-h-40)
- ✅ Shows file download card (filename + size + Download button) if file exists
  - Screenshot confirmed: algebra_answers.txt (22 B) with Download button
- ✅ Shows feedback textarea (editable for reviewable submissions)
- ✅ Shows marks input (number, optional)
- ✅ Shows "Close", "Return", "Mark Reviewed" buttons for submitted/late status
- ✅ Shows read-only feedback + marks for already-reviewed submissions
- ✅ Shows "Return for Resubmission" button for reviewed submissions
- ✅ Modal closes after successful review action
- ✅ Submissions list auto-refreshes after review action

## Existing Functionality Not Broken
- ✅ Homework create modal still works
- ✅ Homework delete (trash) button still works
- ✅ Student/parent view: shows read-only homework list (no submission actions)

## Screenshot Evidence
- web_homework_list.png ✅
- web_homework_submissions_list.png ✅
- web_homework_review_modal.png ✅ (showing returned submission with text + feedback + marks)
- web_homework_reviewed_status.png ✅ (showing reviewable submission with file + feedback form + Mark Reviewed button)
