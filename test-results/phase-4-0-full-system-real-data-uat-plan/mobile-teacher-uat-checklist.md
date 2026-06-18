# Phase 4.0: Mobile Teacher UAT Checklist

**Platform**: Mobile App — Teacher Role
**Test Credential**: `teacher@school.com` (verify password before UAT)
**Real data basis**: Live `school_erp` database
**Device/Emulator**: Pixel_8 API 34 (Android Emulator)

---

## Pre-Check: Credential Verification
- [ ] Confirm `teacher@school.com` can log in successfully
- [ ] If login fails, check admin panel for password reset or use `tea.alice.0070@school.local`
- [ ] Note which class(es) are assigned to the test teacher

---

## 1. Teacher Login
- **Screen**: `LoginScreen`
- **Flow**: Enter `teacher@school.com` → enter password → tap Login
- **Expected**: Redirects to `TeacherHomeScreen`; no role mismatch error
- **Risk**: Incorrect role detection causing redirect to wrong dashboard
- **Priority**: P1 / Read

---

## 2. Teacher Dashboard
- **Screen**: `TeacherHomeScreen`
- **Flow**: Scroll full dashboard after login
- **Real data to verify**:
  - Greeting shows teacher's real name
  - Class count: number of classes assigned to this teacher
  - Schedule preview: today's timetable (if timetable_entries exist for teacher)
  - Homework preview: up to 3 recent assignments
- **Expected**: All widgets load with real data, not zeros or empty
- **Risk**: Class count shows 0 if teacher-class join table incomplete
- **Priority**: P1 / Read

---

## 3. Teacher Attendance — Class List
- **Screen**: `TeacherAttendanceScreen` (class list view)
- **Flow**: Tap Attendance tab from bottom navigator
- **Real data to verify**: Classes assigned to test teacher appear; student counts shown
- **Expected**: At least 1 class visible (e.g., Class 1-A with 28 students)
- **Risk**: Empty list if teacher-class link not set for `teacher@school.com`
- **Priority**: P1 / Read

---

## 4. Teacher Attendance — Student Roster
- **Screen**: `TeacherAttendanceScreen` (student list within class)
- **Flow**: Tap a class from the list → view student roster
- **Real data to verify**: Student names from real enrollment (e.g., Class 1-A: 28 students)
- **Expected**: All students listed with default status (unmarked)
- **Risk**: Student names garbled or list incomplete
- **Priority**: P1 / Read

---

## 5. Teacher Attendance — Mark & Submit (Write — Backup First)
- **Screen**: `TeacherAttendanceScreen` (marking view)
- **Flow**: Mark all present → tap Submit
- **Real data**: Submit attendance for actual students
- **Expected**: Success toast, attendance records created in DB
- **Risk**: Payload mismatch causing 400/500 from server; duplicate attendance entry if marking twice
- **Priority**: P2 / **WRITE**
- **Pre-condition**: DB backup must exist before this step

---

## 6. Teacher Timetable
- **Screen**: `TeacherTimetableScreen`
- **Flow**: Tap Timetable tab → swipe Mon–Fri pills
- **Real data to verify**: 3 timetable_entries in DB; at least 1 should be visible for test teacher's day
- **Expected**: Slots shown for days with real entries; `EmptyState` shown for days with no entries
- **Risk**: Weekday pills all show empty even when entries exist
- **Priority**: P1 / Read

---

## 7. Teacher Homework — Assignment List
- **Screen**: `TeacherHomeworkScreen` (list view)
- **Flow**: Tap Homework tab
- **Real data to verify**: 3 homework assignments exist; show assignments for teacher's class
- **Expected**: Assignments listed with title, class, subject, due date, submission count
- **Risk**: Empty list if homework filtered by class but teacher's class not matched
- **Priority**: P1 / Read

---

## 8. Teacher Homework — Submission Review (Write)
- **Screen**: `TeacherHomeworkScreen` (review modal)
- **Flow**: Tap a homework → select a student's submission → write remark → submit review
- **Real data to verify**: 2 homework submissions exist
- **Expected**: Submission detail opens; remark saved; submission status updated to "reviewed"
- **Risk**: Keyboard overlapping the submit button on review modal
- **Priority**: P2 / **WRITE**

---

## 9. Teacher Marks — Exam List
- **Screen**: `TeacherMarksScreen` (exam list)
- **Flow**: Tap Marks tab → view exam list
- **Real data to verify**: 3 exams — Quarterly Quiz, Sync Exam, First Term Exam
- **Expected**: All 3 listed; selecting one opens marks entry grid
- **Risk**: Exams filtered by date hide past exams
- **Priority**: P1 / Read

---

## 10. Teacher Marks — Entry Grid
- **Screen**: `TeacherMarksScreen` (marks entry)
- **Flow**: Select an exam → view marks grid
- **Real data to verify**: Students from teacher's class listed; 5 results already exist
- **Expected**: Pre-existing marks shown in their input fields; empty cells for students with no marks
- **Risk**: Grid shows all zeros instead of existing marks
- **Priority**: P1 / Read

---

## 11. Teacher Marks — Submit (Write — Backup First)
- **Screen**: `TeacherMarksScreen` (marks entry)
- **Flow**: Enter marks for 1–2 students → tap Save/Submit
- **Real data**: Write new marks for students who have no existing result
- **Expected**: Success response; marks stored in `results` table
- **Risk**: Sticky footer save button clipping behind bottom nav; double-submission on multi-tap
- **Priority**: P2 / **WRITE**
- **Pre-condition**: DB backup must exist before this step

---

## 12. Teacher Notices
- **Screen**: `TeacherNoticesScreen`
- **Flow**: Tap Notices tab → view circular list
- **Real data to verify**: 4 notices; those with audience TEACHER or ALL should appear
- **Expected**: At least the ALL-audience notices visible
- **Risk**: Role filter excluding valid notices
- **Priority**: P1 / Read

---

## 13. Bottom Navigation
- **Flow**: Tap each bottom tab (Home, Attendance, Timetable, Homework, Marks, Notices)
- **Expected**: Each tab navigates to correct screen with no state bleed from previous tab
- **Risk**: Active tab indicator mismatched with actual screen
- **Priority**: P1 / Read

---

## 14. Pull-to-Refresh
- **Flow**: On each main screen, pull down to trigger refresh
- **Expected**: Loading indicator shows, data reloads from server
- **Risk**: Refresh spinner stuck indefinitely
- **Priority**: P1 / Read

---

## 15. Logout
- **Flow**: Find logout action (profile/settings or header menu) → logout
- **Expected**: Redirected to `LoginScreen`, teacher session cleared
- **Priority**: P1 / Read

---

## Pass Criteria
- Login succeeds and routes to correct teacher dashboard
- Real class and student data shows on attendance and marks screens
- At least 3 exams and 3 homework assignments visible
- No crash on tab navigation or pull-to-refresh
- Write flows (attendance submit, marks submit) return success (P2 — only after backup)
