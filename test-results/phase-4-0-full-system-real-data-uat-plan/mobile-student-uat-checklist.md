# Phase 4.0: Mobile Student UAT Checklist

**Platform**: Mobile App — Student Role
**Test Credentials**:
- Student 1: `stu.adm20267672@school.local` / `<STUDENT_PASSWORD>` (Prisha72 Mehta)
- Student 2: `stu.adm20268263@school.local` / `<STUDENT_PASSWORD>` (Myra191 Pillai)
- Student 3: `stu.adm20264757@school.local` / `<STUDENT_PASSWORD>` (Anika32 Kulkarni)
**Real data basis**: Live `school_erp` database
**Device/Emulator**: Pixel_8 API 34 (Android Emulator)

---

## Pre-Check: Credential Verification
- [ ] Confirm `stu.adm20267672@school.local` + `<STUDENT_PASSWORD>` logs in successfully
- [ ] Note which class/section the student belongs to
- [ ] Identify if this student has any homework, exam results, or attendance records

---

## 1. Student Login
- **Screen**: `LoginScreen`
- **Flow**: Enter student email → enter `<STUDENT_PASSWORD>` → tap Login
- **Expected**: Redirects to `StudentHomeScreen`; correct student name shown
- **Risk**: Role detection returning PARENT or TEACHER for student account
- **Priority**: P1 / Read

---

## 2. Student Dashboard
- **Screen**: `StudentHomeScreen`
- **Flow**: Scroll full dashboard after login
- **Real data to verify**:
  - Greeting shows real student name (e.g., "Prisha72 Mehta")
  - Class/Section shown (e.g., "Class 1-A")
  - Homework preview: any of the 3 real assignments relevant to student's class
  - Upcoming exam: any of the 3 exams (Quarterly Quiz, Sync Exam, First Term)
- **Expected**: Widgets populate with real data — not all zeros or empty
- **Risk**: Homework and exam previews empty even when records exist for student's class
- **Priority**: P1 / Read

---

## 3. Student Timetable
- **Screen**: `StudentTimetableScreen`
- **Flow**: Tap Timetable tab → view daily schedule
- **Real data to verify**: 3 timetable_entries in DB; student's class section timetable shown
- **Expected**: Day-wise slots visible; EmptyState shown for days with no entries
- **Risk**: All days showing empty even when entries exist for student's class
- **Priority**: P1 / Read

---

## 4. Student Homework — Assignment List
- **Screen**: `StudentHomeworkScreen` (list view)
- **Flow**: Tap Homework tab → view assignments
- **Real data to verify**: 3 homework assignments; those for student's class should appear
- **Expected**: Assignments listed with title, subject, due date, and submission status (pending/submitted)
- **Risk**: Status badge showing "pending" for an assignment the student has already submitted
- **Priority**: P1 / Read

---

## 5. Student Homework — Submission Modal
- **Screen**: `HomeworkSubmissionModal`
- **Flow**: Tap a homework assignment → open submission modal
- **Expected**: Modal opens with text input and file attachment placeholder; Cancel and Submit visible
- **Risk**: Keyboard covering Submit button; modal not dismissing on Cancel tap
- **Priority**: P1 / Read

---

## 6. Student Homework — Submit (Write)
- **Screen**: `HomeworkSubmissionModal`
- **Flow**: Enter a text response → tap Submit
- **Real data**: Submit on a homework not yet submitted by this student
- **Expected**: Submission saved; assignment status changes to "submitted" or "pending review"
- **Risk**: Submission fails with 400 if student's enrollment sectionId doesn't match homework classId
- **Priority**: P2 / **WRITE**
- **Pre-condition**: Confirm student has a pending (unsubmitted) homework assignment

---

## 7. Student Exams — Exam List
- **Screen**: `StudentExamsScreen` (exam list)
- **Flow**: Tap Exams tab → view exam list
- **Real data to verify**: 3 exams — Quarterly Mathematics Quiz, Phase 3.2D Sync Exam, First Term Examination
- **Expected**: All 3 exams shown with name, type, date range
- **Risk**: Exam list filtered to only future exams, hiding the Quarterly Quiz (past date)
- **Priority**: P1 / Read

---

## 8. Student Exams — Results/Scores
- **Screen**: `StudentExamsScreen` (results view)
- **Flow**: Tap an exam → view score card
- **Real data to verify**: 5 results exist in DB — at least 1 may belong to a test student
- **Expected**: Score card shows marks, percentage, and grade for the student
- **Risk**: Score card shows "No results yet" even when a result record exists
- **Priority**: P1 / Read

---

## 9. Bottom Navigation
- **Flow**: Tap each bottom tab (Home, Timetable, Homework, Exams)
- **Expected**: Correct screen loads; active tab highlighted; no state bleed between tabs
- **Risk**: Navigating Home → Exams → Home leaves exam state stuck
- **Priority**: P1 / Read

---

## 10. Pull-to-Refresh
- **Flow**: Pull down on Homework and Exams screens
- **Expected**: Loading indicator shows and content reloads
- **Risk**: Pull-to-refresh spinner doesn't stop after data loads
- **Priority**: P1 / Read

---

## 11. Logout
- **Flow**: Logout action → redirected to LoginScreen
- **Expected**: Student session cleared, no residual data visible on re-login
- **Priority**: P1 / Read

---

## Pass Criteria
- Student login succeeds; correct class/section shown on dashboard
- Homework for student's class appears in list (not empty)
- All 3 exams visible (past + future)
- Results shown for exams with existing marks data
- Submission modal opens without keyboard overlap issues
- No crash on tab switches or pull-to-refresh
