# Runtime Verification Notes – Phase 3.3D

## Test Environment
- Device: Android Emulator (Pixel_8 API 34)
- Packager: Expo Metro Bundler
- API Status: Vantage ERP Backend Local Server (localhost:8081)

## Teacher Notices
- Screen loads and renders notices list with priority-coloured left borders.
- Urgent banner appears at top when `priority === 'urgent'` notices exist.
- Tap to expand: `LayoutAnimation` easeInEaseOut plays smoothly.
- Collapsed view shows title + date + audience + chevron-down.
- Expanded view reveals full content in `colors.surfaceSoft` inset box + chevron-up.
- Pull-to-refresh reloads notices.
- Empty state renders with emoji and subtitle.
- Teacher count badge visible in header.

## Teacher Timetable
- Screen auto-selects today's tab on mount.
- Today tab shows dot indicator below abbreviated day label.
- Today banner "Today's Schedule — N periods" visible in teacher purple.
- Non-today tab active: solid purple fill, white text.
- `TodayScheduleCard` renders each period with period number, subject, time range, class–section.
- Empty day tab shows `EmptyState`.
- Switching day tabs updates the period list.
- Pull-to-refresh reloads data.

## Teacher Homework
- Screen loads homework list with `HomeworkManagementCard` per item.
- Stats grid shows Students/Submitted/Pending/Reviewed with semantic colours.
- Pending alert banner visible for items with `pendingCount > 0`.
- Due date badge shows correct colour (danger/warning/muted).
- "Review Submissions" button opens `TeacherHomeworkSubmissionsView` sub-view.
- Back from sub-view triggers `loadHomework(true)` and refreshes list.
- Empty state renders when no homework.
- Pull-to-refresh works.

## Teacher Attendance
### Class List
- AppCard class list renders with Done/Pending states.
- Done classes: green border + StatusBadge Done.
- Pending classes: purple border + "Mark Now" badge with chevron.
- Pull-to-refresh reloads class list.
- Empty state renders.

### Student Marking View
- Student list loads after class tap.
- Quick actions row: "Mark All Present" (green) + "Reset" (muted) buttons visible.
- Tapping "Mark All Present" sets all student statuses to present.
- 3-segment pill toggle per student: active segment gets solid colour fill.
- Tapping a different segment immediately updates the student status and left border colour.
- Summary bar updates live: Present/Absent/Late/Total counts with Ionicons.
- Submit sends correct payload (`classId`, `date`, `records[]`).
- Success alert shown and screen returns to class list.
- Error alert shown on failure.

## Teacher Marks
### Exam List
- Exam cards render with progress bars, stats strips, status badges.
- Progress bar fills proportionally to `marksEnteredCount/totalStudents`.
- Pull-to-refresh reloads exams.
- Empty state renders.

### Subject List
- Subject cards render with progress bar and graded/pending counts.
- Max marks badge visible.
- Back to Exams works.

### Student Marks Entry
- Student list loads with pre-filled existing marks and remarks.
- Max marks row shows editable `TextInput` in teacher purple.
- Score field: invalid input shows red border + error message.
- Max marks change re-validates all score fields.
- Remarks field accepts text.
- Sticky footer visible: Cancel + Save Marks buttons.
- Save Marks sends correct payload.
- Keyboard does not clip sticky footer (KeyboardAvoidingView works).
- Back to Subjects works.
