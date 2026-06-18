# Phase 4.0: Full System Real Data UAT — Implementation Plan

## Overview
This phase performs a complete end-to-end User Acceptance Test of the entire Vantage School ERP
system using the **real data currently present in the production database**. No seed scripts, no
dummy data, no database resets. All test flows must be driven by actual records.

The UAT covers three distinct surfaces:
1. **Web console** (React + Vite — admin, school admin, super admin roles)
2. **Mobile Teacher app** (React Native — Teacher role)
3. **Mobile Student app** (React Native — Student role)
4. **Mobile Parent app** (React Native — Parent role)

---

## Stable Checkpoint
| Item | Value |
|---|---|
| Branch | `Nupun` |
| HEAD | `5f9acd021655db166ad8d040e0a4844f68aa8e81` |
| Prior phase | Phase 3.5 Mobile Final Handoff — CLOSED / PASS |

---

## Real Data Inventory (Live Database: `school_erp`)

The following record counts were verified directly from the live MySQL database:

| Entity | Count | Notes |
|---|---|---|
| Schools | 1 | Single tenant deployment |
| Academic Years | 1 | `2025-26` (isCurrent=true, Apr 2025 – Mar 2026) |
| Classes | 10 | Class 1 – Class 10 |
| Sections | 20 | 2 sections per class (A/B), one active per class |
| Subjects | 10 | Subject catalogue defined |
| Students | 274 | Distributed across Class 1A – 10A/B, ~26–33 per section |
| Teachers (users) | 8 | `teacher@school.com` is primary test teacher |
| Parents (users) | 269 | Pattern: `parent.adm<id>@school.local` |
| Admissions | 16 | Historical admission records |
| Homework assignments | 3 | Real assignments exist |
| Homework submissions | 2 | Student submissions on file |
| Exams | 3 | Quarterly Quiz, Sync Exam, First Term Examination |
| Results (marks) | 5 | Marks entered for select exams |
| Attendance records | 32 | Attendance rows on record |
| Timetable entries | 3 | Timetable slots configured |
| Fee structures | 4 | Term 1 Fee, Tuition Fee, Books & Stationery, Phase check |
| Student fees | 805 | 802 pending + 3 partial |
| Fee payments | 52 | Historical payment transactions |
| Notices | 4 | Published notices on record |

### Key Test Credentials
| Role | Email | Password |
|---|---|---|
| Admin (Web) | `admin@school.com` | `<ADMIN_PASSWORD>` |
| Teacher (Mobile) | `teacher@school.com` | *(existing password)* |
| Teacher (Alt) | `tea.alice.0070@school.local` | *(existing password)* |
| Student (Mobile) | `stu.adm20267672@school.local` | `<STUDENT_PASSWORD>` |
| Parent (Mobile) | `parent.adm20267881@school.local` | *(existing password)* |

> **Note**: Teacher and parent passwords are set at account creation and must be verified
> against the real database before execution. Default student password is `<STUDENT_PASSWORD>`.

---

## UAT Scope Breakdown

### Web Console (Admin) — Scope
- Login & session management
- Dashboard: School summary, student/teacher/fee counts
- Admissions: List, view details, convert to student
- Students: List, profile, attendance history, fees view
- Teachers: List, profile
- Classes & Sections: Structure view
- Timetable management
- Homework: Assignment list, submission review
- Exams: Schedule list, marks entry (admin view)
- Fees: Fee structures, student fee ledgers, payment collection, transactions
- Notices: Create, publish, audience filter
- Settings: Module management, archive, school settings
- Reports: Report cards, attendance summaries

### Mobile — Teacher Role Scope
- Login, dashboard with real class counts
- Attendance: Class list → student roster → mark & submit
- Timetable: Day-wise schedule
- Homework: Assignment list, submission review, grade/remark entry
- Marks: Exam selection, marks entry grid, save/submit
- Notices: Circular list

### Mobile — Student Role Scope
- Login, dashboard with real academic data
- Timetable: Subject schedule
- Homework: Assignment list with status, submission modal
- Exams/Results: Exam list, score cards

### Mobile — Parent Role Scope
- Login, dashboard with child selector
- Attendance: Child attendance history and percentage
- Academics: Timetable / Homework / Exams / Results tabs per child
- Fees: Outstanding balance, fee ledger
- Notices: Circular list

---

## UAT Rules
1. **Read-first, write-cautiously**: Validate all read flows before any write operation.
2. **No destructive writes on production data**: Fee waivers, archive actions, and student deletion
   must NOT be exercised unless using a UAT copy of the database.
3. **DB backup before write testing**: Take `mysqldump` backup before executing any write-heavy UAT
   (fee collection, marks submission, attendance submission).
4. **No dummy data injection**: Only interact with records already present in the database.
5. **No seed scripts**: `seed-*.ts` scripts must NOT be run during this phase.
6. **No migration scripts**: No schema changes.
7. **Document all bugs**: Every bug found must be logged with severity, screen, expected vs actual,
   before any fix is attempted.

---

## Files to be Created
```
test-results/phase-4-0-full-system-real-data-uat-plan/
  implementation-plan.md          ← this file
  real-data-inventory.md          ← full DB snapshot & test credentials
  uat-scope.md                    ← complete scope across all roles/surfaces
  web-admin-uat-checklist.md      ← web console checklist
  teacher-mobile-uat-checklist.md ← mobile teacher checklist
  student-mobile-uat-checklist.md ← mobile student checklist
  parent-mobile-uat-checklist.md  ← mobile parent checklist
  cross-platform-sync-plan.md     ← sync validation between web & mobile
  risk-and-validation-plan.md     ← risk matrix, automated checks, backup plan
  db-backup-procedure.md          ← pre-UAT backup steps
```

---

## Verification Plan

### Pre-UAT Automated Checks
```bash
# TypeScript compilation
cd mobile && npx tsc --noEmit
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit

# DB backup
mysqldump -u root -p school_erp > school_erp_uat_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Manual Verification
- All read flows verified on live database
- Write flows verified on a DB copy (with backup in place)
- Cross-platform data sync: any change via web console reflected on mobile and vice versa
- Role isolation: one role cannot access another role's data or screens
