# Phase 4.0: Cross-Platform Data Sync Validation Plan

## Purpose
Validate that data written via one platform (web or mobile) is correctly reflected in the other
platform without manual refresh, schema mismatch, or data loss. All assertions are based on
real records in the live `school_erp` database.

---

## Sync Scenario Matrix

| # | Action (Source) | Expected Reflection (Target) | Priority |
|---|---|---|---|
| 1 | Admin creates a notice via Web | Notice appears in Mobile (Teacher/Student/Parent) on next load | P1 |
| 2 | Teacher submits attendance via Mobile | Attendance visible in Student profile on Web admin | P1 |
| 3 | Teacher enters marks via Mobile | Marks appear in Exams/Results on Mobile Student & in Web marks view | P1 |
| 4 | Admin collects fee payment via Web | Fee balance decreases in Mobile Parent fees screen | P1 |
| 5 | Teacher reviews homework via Mobile | Homework submission status updates visible in Web admin homework view | P2 |
| 6 | Student submits homework via Mobile | Submission count increments in Teacher's homework list on Mobile | P2 |
| 7 | Admin updates fee structure via Web | Student fee assignments reflect updated amounts on Mobile Parent fees | P2 |
| 8 | Admin archives a student via Web | Student no longer appears in Teacher's attendance/marks roster on Mobile | P2 |

---

## Sync Test 1: Notice Publish → Mobile Visibility
**Source**: Web Admin — Create notice (audience=ALL)
**Steps**:
1. Admin logs in to web console
2. Navigate to Notices → Create new notice with title "UAT Test Notice", audience=ALL
3. Save the notice
4. On Mobile, login as Teacher/Student/Parent
5. Navigate to Notices screen
**Expected**: "UAT Test Notice" appears in the list on Mobile
**Risk**: Notice audience filter on mobile excluding ALL; caching delay preventing visibility
**Verification**: Check `notices` table count increments from 4 → 5 after creation

---

## Sync Test 2: Teacher Attendance Submit → Web Student Profile
**Source**: Mobile Teacher — Mark attendance for Class 1-A
**Steps**:
1. Teacher logs into Mobile
2. Mark attendance for all Class 1-A students (Present)
3. Submit attendance
4. Log into Web admin
5. Navigate to Student profile → Attendance history for a Class 1-A student
**Expected**: Today's attendance entry (Present) visible in Web student attendance history
**Risk**: Attendance records not joined to Web's attendance view due to school ID scope mismatch
**Verification**: `SELECT COUNT(*) FROM attendance WHERE DATE(date) = CURDATE();` increases

---

## Sync Test 3: Teacher Marks Submit → Student Results
**Source**: Mobile Teacher — Enter marks for an exam
**Steps**:
1. Teacher enters marks for 2 students in "First Term Examination"
2. Submit via Mobile Teacher marks screen
3. Login as Student on Mobile
4. Navigate to Exams → First Term Examination → view results
**Expected**: Student sees their mark for this exam
**Risk**: Results table `studentId` mismatch; marks saved under wrong exam
**Verification**: `SELECT COUNT(*) FROM results WHERE examId = '<id>';` increases after submit

---

## Sync Test 4: Fee Payment via Web → Mobile Parent Balance
**Source**: Web Admin — Record fee payment for a test student
**Steps**:
1. Admin logs into Web → Fees → Fee Collection
2. Select test student → enter partial payment amount → Submit
3. Login as Parent (linked to that student) on Mobile
4. Navigate to Fees tab
**Expected**: Outstanding balance decreases by the payment amount entered
**Risk**: Parent fee screen not recalculating after payment; wrong studentId linked to parent
**Verification**: `SELECT status FROM student_fees WHERE studentId='<id>';` changes from pending → partial

---

## Sync Test 5: Student Homework Submit → Teacher Review
**Source**: Mobile Student — Submit homework
**Steps**:
1. Student submits a homework response via Mobile submission modal
2. Teacher logs into Mobile
3. Navigate to Homework → open the assignment submitted by student
**Expected**: Submission appears in teacher's review list with student name
**Risk**: Submission stored but not associated with homework ID properly
**Verification**: `SELECT COUNT(*) FROM homework_submissions;` increments from 2 → 3

---

## Real-Time vs Eventual Consistency
All sync tests above rely on server-side REST API responses being immediately consistent
(no background job or message queue). Since this is a synchronous Express + MySQL system:
- Data written via API should be immediately readable on the next GET request
- Mobile screens use pull-to-refresh and navigation-trigger fetches; results should be
  visible after a manual pull-to-refresh on the target screen

---

## Automated Sync Check Scripts
After manual sync tests, run the parity verification scripts:
```bash
cd server
npx ts-node --transpile-only scripts/audit-mobile-academic-parity.ts
```

If any sync scenario fails, log the discrepancy as a bug with:
- Source action (what was written)
- Target screen (where it should appear)
- DB query confirming the write succeeded
- UI screenshot showing the stale/missing data
