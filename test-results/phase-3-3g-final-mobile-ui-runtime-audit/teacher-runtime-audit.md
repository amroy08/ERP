# Teacher Screens Runtime Audit — Phase 3.3G

## Teacher Attendance
- [x] Class selection roster screen lists classes correctly.
- [x] Marking sheet roster populates students list.
- [x] Action pills (Present, Absent, Late) successfully toggle individual student states.
- [x] "Mark All Present" batch action updates entire list at once.
- [x] "Reset" button clears active selections correctly.
- [x] "Submit" button saves marked states to database (no visual issues or server failures).

## Teacher Timetable
- [x] Horizontal weekday navigation tab bar functions seamlessly.
- [x] Agenda entries display room data, periods, classes, and timings correctly.
- [x] Handles empty scheduling days using a premium `EmptyState` component.

## Teacher Homework
- [x] Homework listings display class parameters, total submissions counts, and due statuses.
- [x] Sub-view transitions for review details open and close correctly.
- [x] Blank homework lists display the themed `EmptyState` layout.

## Teacher Marks
- [x] Exam schedule categories and lists populate successfully.
- [x] Subject selection list filters classes correctly.
- [x] Marks roster input blocks render student names, roll numbers, and grade fields.
- [x] Marks input validates ranges (0 to max) and handles float/null properties correctly.
- [x] Sticky action save button remains reachable and saves states.

## Teacher Notices
- [x] Notices lists display titles, priority flags, and publisher tags.
- [x] Interactive card collapse/expand features reveal bodies correctly.
