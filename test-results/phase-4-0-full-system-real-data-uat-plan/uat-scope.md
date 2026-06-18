# Phase 4.0: Full System Real Data UAT — Scope Definition

## Scope Overview
This UAT validates the complete Vantage School ERP system using **live data** from the `school_erp`
database. No seed scripts. No dummy records. All assertions must match real database state.

---

## Platform Coverage

### 1. Web Console (React + Vite — runs on `http://localhost:5173`)
**Accessible roles**: Admin (school admin), Super Admin
**Coverage**:
- Authentication & session management
- Dashboard: real school-level aggregate stats
- Admissions module: listing and detail review
- Student management: list, profile, attendance history, fee ledger
- Teacher management: list, profile
- Class & section structure
- Timetable management
- Homework: assignment list and submission overview
- Exams: schedule and marks view/entry (admin)
- Fees: structures, student fee assignment, payment collection, transaction history
- Notices: create, publish, audience filter
- Reports: attendance summaries, report cards
- Settings: module toggles, archive, school settings

### 2. Mobile — Teacher Role (React Native)
**Coverage**:
- Login with real teacher credential
- Dashboard: real class counts, schedule snippets, greeting
- Attendance: real class list → student roster → mark present/absent/late → submit
- Timetable: real day-wise schedule (Mon–Fri)
- Homework: real assignment list, submission review, grade & remarks
- Marks: real exam list, marks entry grid, submit
- Notices: real circular list

### 3. Mobile — Student Role (React Native)
**Coverage**:
- Login with real student credential
- Dashboard: real subject/homework/exam widgets
- Timetable: real subject schedule
- Homework: real assignment list with status, submission modal
- Exams/Results: real exam list, score cards with percentages

### 4. Mobile — Parent Role (React Native)
**Coverage**:
- Login with real parent credential
- Dashboard: real child selector, child-specific data
- Attendance: real child attendance rate + history
- Academics tab: Timetable / Homework / Exams / Results for child
- Fees: real outstanding balance, itemized fee ledger
- Notices: real circular list

---

## Test Flow Priority Matrix

| Flow | Platform | Priority | Write? |
|---|---|---|---|
| Admin login | Web | P1 | No |
| Student list & profile | Web | P1 | No |
| Fee structure view | Web | P1 | No |
| Fee collection (write) | Web | P2 | **YES — backup first** |
| Notice publish | Web | P2 | **YES — backup first** |
| Homework list & marks view | Web | P1 | No |
| Admission detail view | Web | P2 | No |
| Report card view | Web | P2 | No |
| Teacher login | Mobile | P1 | No |
| Teacher attendance submit | Mobile | P1 | **YES — backup first** |
| Teacher marks entry submit | Mobile | P1 | **YES — backup first** |
| Teacher homework review | Mobile | P1 | **YES** |
| Student login | Mobile | P1 | No |
| Student homework submission | Mobile | P1 | **YES** |
| Parent login | Mobile | P1 | No |
| Parent attendance view | Mobile | P1 | No |
| Parent fees view | Mobile | P1 | No |
| Cross-platform data sync | Both | P1 | No |
| Role isolation test | Both | P1 | No |

---

## Out of Scope
- EAS / APK build
- Database seeding or reset
- Prisma migration execution
- Modifying `client/src/features/admissions/AdmissionFormPage.tsx`
- Staging `local-builds/`, `.env`, `logs`, Firebase/signing files
- Super-admin tenant management flows
- Archive/delete operations on real students
- Any action that would cause irreversible data loss

---

## Data Safety Rules
1. Take `mysqldump` backup before any write-heavy test session.
2. Document every write operation (what, when, by whom).
3. If any unintended data state results from a write test, restore from backup.
4. All P2 write flows must be explicitly approved before execution.
