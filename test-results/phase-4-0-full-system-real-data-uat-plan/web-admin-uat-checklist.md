# Phase 4.0: Web Admin UAT Checklist

**Platform**: Web Console (`http://localhost:5173`)
**Role**: Admin (`admin@school.com` / `<ADMIN_PASSWORD>`)
**Real data basis**: Live `school_erp` database

---

## 1. Authentication
- **Screen**: Login page
- **Flow**: Enter email `admin@school.com` + password `<ADMIN_PASSWORD>` → Submit
- **Expected**: Redirect to admin dashboard, JWT token set, role shown as Admin
- **Risk**: Login fails if server not running — verify `npm run dev` in `/server`
- **Priority**: P1 / Read

---

## 2. Admin Dashboard
- **Screen**: Dashboard (`/dashboard`)
- **Flow**: View summary cards after login
- **Real data to verify**:
  - Total Students: ~274
  - Total Teachers: ~8
  - School name reflects real school name
  - Current academic year: `2025-26`
- **Expected**: All counts match DB values
- **Risk**: Stale cache showing zeros
- **Priority**: P1 / Read

---

## 3. Students List
- **Screen**: Students list (`/students`)
- **Flow**: Navigate to Students, view paginated list
- **Real data to verify**: 274 students visible with correct names and class assignments
- **Expected**: Students show class/section and enrollment status
- **Risk**: Pagination breaks; missing school filter
- **Priority**: P1 / Read

---

## 4. Student Profile
- **Screen**: Student profile (`/students/:id`)
- **Flow**: Click any student from list → view profile
- **Real data to verify**: Name, class, section, parent name, admission date visible
- **Expected**: Full profile renders with correct data
- **Risk**: Missing parent linkage for some students
- **Priority**: P1 / Read

---

## 5. Student Attendance History
- **Screen**: Student attendance (`/students/:id/attendance` or within profile)
- **Flow**: View student's attendance history
- **Real data to verify**: 32 attendance records exist — at least 1 should show for test student
- **Expected**: Attendance percentage and date-wise history displayed
- **Risk**: Empty state shown even when records exist
- **Priority**: P1 / Read

---

## 6. Student Fee Ledger
- **Screen**: Student fees (`/fees/student/:id`)
- **Flow**: Navigate to student fees from student profile or Fees menu
- **Real data to verify**: 805 student fee rows exist (802 pending, 3 partial); fee payment count: 52
- **Expected**: Outstanding balance calculated correctly; fee items listed
- **Risk**: Balance calculation rounding error
- **Priority**: P1 / Read

---

## 7. Fee Structures
- **Screen**: Fee structures (`/fees/structures`)
- **Flow**: View all fee structures
- **Real data to verify**: 4 structures — Term 1 Fee (₹20,000), Tuition Fee (₹10,000), Books & Stationery (₹10,000), Phase 3.2G check (₹4,500)
- **Expected**: All 4 visible with correct amounts and class mappings
- **Risk**: Class-less fee structures may not show class column
- **Priority**: P1 / Read

---

## 8. Fee Collection (Write — Backup First)
- **Screen**: Fee collection (`/fees/collect`)
- **Flow**: Select student → select fee item → enter amount → Submit
- **Real data**: Use a `pending` student fee record for a test student
- **Expected**: Payment recorded, balance decreases, receipt generated
- **Risk**: Double-posting on rapid submit; receipt number conflict
- **Priority**: P2 / **WRITE**
- **Pre-condition**: DB backup must exist before this step

---

## 9. Fee Transactions
- **Screen**: Fee transactions (`/fees/transactions`)
- **Flow**: View transaction history
- **Real data to verify**: 52 existing fee payment records
- **Expected**: All transactions listed with dates, amounts, student names, receipt IDs
- **Risk**: Pagination skipping records
- **Priority**: P1 / Read

---

## 10. Teachers List
- **Screen**: Teachers list (`/teachers`)
- **Flow**: Navigate to Teachers
- **Real data to verify**: 8 teachers in system
- **Expected**: All 8 visible with name, subjects, class assignments
- **Risk**: Empty list if teacher-class links missing
- **Priority**: P1 / Read

---

## 11. Admissions List
- **Screen**: Admissions (`/admissions`)
- **Flow**: Navigate to Admissions
- **Real data to verify**: 16 historical admission records
- **Expected**: List renders with student name, class applied, admission date, status
- **Risk**: Archived admissions may be hidden by default filter
- **Priority**: P2 / Read

---

## 12. Admission Detail
- **Screen**: Admission detail modal
- **Flow**: Click an admission record → view details
- **Expected**: All fields populated — name, class, parent info, documents section
- **Risk**: Missing fields for older admissions
- **Priority**: P2 / Read

---

## 13. Timetable Management
- **Screen**: Timetable (`/timetable`)
- **Flow**: View existing timetable entries
- **Real data to verify**: 3 timetable_entries in DB
- **Expected**: Timetable grid displays the 3 scheduled slots
- **Risk**: Grid renders blank if subject/teacher assignments are missing
- **Priority**: P2 / Read

---

## 14. Homework List (Admin View)
- **Screen**: Homework (`/homework`)
- **Flow**: View all homework assignments
- **Real data to verify**: 3 homework records, 2 submissions
- **Expected**: 3 assignments listed with class, subject, due date, submission count
- **Risk**: Submissions count showing 0 when 2 exist
- **Priority**: P1 / Read

---

## 15. Exams List
- **Screen**: Exams (`/exams`)
- **Flow**: View exam schedule
- **Real data to verify**: 3 exams — Quarterly Quiz, Sync Exam, First Term Examination
- **Expected**: All 3 listed with type, date range
- **Risk**: Exams with past dates hidden by default date filter
- **Priority**: P1 / Read

---

## 16. Marks / Results (Admin View)
- **Screen**: Exam marks / results
- **Flow**: Select an exam → view marks entry grid
- **Real data to verify**: 5 result records exist
- **Expected**: 5 existing marks visible; empty rows for students with no marks yet
- **Risk**: Grid showing zero marks for all if result-exam foreign key mismatch
- **Priority**: P1 / Read

---

## 17. Notices — List & Publish
- **Screen**: Notices (`/notices`)
- **Flow**: View existing notices; create a new notice (P2 write)
- **Real data to verify**: 4 published notices
- **Expected**: All 4 notices visible with title, audience, date
- **Publish test (write)**: Create a notice for audience=ALL → Save → Verify appears in list
- **Risk**: Audience filter mismatch sending to wrong role
- **Priority**: P1 (read), P2 (write — backup first)

---

## 18. Reports
- **Screen**: Reports (`/reports`)
- **Flow**: Generate attendance summary and report card
- **Real data to verify**: Use real class + student data
- **Expected**: Summary renders with real student names and real attendance %
- **Risk**: Empty report if attendance records not correctly joined to current academic year
- **Priority**: P2 / Read

---

## 19. Settings — Module Management
- **Screen**: Settings → Module Management (`/settings/modules`)
- **Flow**: View enabled/disabled modules
- **Expected**: All modules visible; toggles reflect current state
- **Risk**: Toggling a module accidentally disabling live functionality — do NOT toggle in UAT
- **Priority**: P2 / Read-only review

---

## 20. Logout & Session Expiry
- **Flow**: Click logout → verify redirect to login
- **Expected**: Token cleared, redirected to `/login`
- **Risk**: Token persisting after logout allowing re-access
- **Priority**: P1 / Read

---

## Pass Criteria
- All P1 read flows render with real data — no empty states where data exists
- Aggregated counts (students, teachers, fees) match DB values within ±1 rounding
- Fee balance calculation matches `totalFee - paidAmount` for any sample record
- No console errors or 500 responses on any read flow
