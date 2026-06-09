# Phase 2 Release Handover Document: UAT & Staging Handover Package

This document details the configuration, deployment setup, credentials, and verification steps necessary for developers, QA engineers, client UAT testers, and staging/deployment teams to review and audit the School ERP application after completing Phase 2.

---

## A. Project Status Summary
The following implementation phases have been successfully completed and audited:
* **Phase 1: Usability Revamp**: Improved overall application layout, responsive navigation, table interactions, modal states, and styling.
* **Phase 2.0: Seed Users and Test Data**: Setup mock institutions, multi-tenant boundaries, and seeded users for all 7 application roles.
* **Phase 2.0.1: Seed Safety Guard**: Added database target safeguards to prevent data loss in non-local environments.
* **Phase 2.1A: High-Risk Backend Safety Fixes**: Patched core security holes, JWT secret fallbacks, IDOR risks, and raw mass-assignment vulnerabilities.
* **Phase 2.1B: Backend Validation and Duplicate Prevention**: Added schema validation and data safety guards for students, classes, and sections.
* **Phase 2.2: Receipt Concurrency Safety**: Resolved concurrent payment race conditions to guarantee unique transaction sequences.
* **Phase 2.3: Student Enrollment History**: Added enrollment log mapping to maintain a historic log of student class/section movements.
* **Phase 2.3.1: Enrollment History Hardening**: Hardened student creation, admission conversion, and promotion pathways.
* **Phase 2.4: Fee Line-Item Allocation**: Developed itemized transaction structures, FIFO auto-allocation, manual allocation input grids, and ledger/receipt views.
* **Phase 2.4.1: Production Build Stabilization**: Cleaned and compiled all server-side and client-side modules to achieve 100% type-checking pass rates.
* **Phase 2.5: Parent & Student Experience Revamp**: Added active student context, parent child switcher, and role-scoped portal views for parent and student accounts. Strengthened backend IDOR guards for student profile, enrollment history, report card, and homework access.
* **Phase 2.6: Email Notification System**: Implemented backend email notification infrastructure and event-triggered email logs for admissions, academic updates, fee receipts, and student absences.
* **Phase 2.7: Admission & Student Document Management**: Revamped the admission form into a guided wizard, added admission and student document upload/download/delete capabilities, automated document copy during admission-to-student conversion, and added a Documents tab to the Student Profile.
* **Release Readiness Audit**: Fully verified and passed.

---

## B. Latest Stable Commit
* **Target Branch**: `Nupun`
* **Stable Commit Hash**: `fd44aa3` (Phase 2.7E-E: Add student profile Documents tab frontend integration)
* **Previous Stable Commit**: `64c2dd8` (Phase 2.6E: Add fee receipt and attendance absent email triggers)
* **Build Status**: **SUCCESS / PASSING** (Clean TS checks and static compilation bundles in both server & client packages).

---

## C. Environment Requirements
The backend server reads configurations from `.env` at the server root.

### Required Environment Variables
| Variable Name | Description | Local Dev Value | Staging/Prod Requirement |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend API port | `5001` | Environment specific (e.g., `80` or `5001`) |
| `CLIENT_URL` | CORS allowed origin | `http://localhost:5173` | Staging/Production domain name |
| `NODE_ENV` | Environment context | `development` | `production` (blocks destructive seed commands) |
| `JWT_SECRET` | Token signature key | `super_secret_jwt_key_123!` | Strong random secret key |
| `JWT_REFRESH_SECRET` | Refresh token signature | `super_secret_refresh_jwt_key_123!` | Strong random secret key |
| `DATABASE_URL` | MySQL connection string | `mysql://root:1234@localhost:3306/school_erp` | Staging/Production database connection |
| `UPLOAD_DIR` | Logo upload path | `"uploads"` | Folder directory |

### Seed Safety Guard Configuration
* To prevent accidental data resets in non-local environments, seeding is **blocked** if `NODE_ENV=production`.
* If the `DATABASE_URL` targets a remote server or contains production keywords, seeding is blocked unless the environment flag `ALLOW_DB_SEED_RESET=true` is explicitly set.

---

## D. Setup Instructions

### Backend (Server) Setup
From the `/server` directory:
```bash
# Install dependencies
npm install

# Generate Prisma Client classes
npx prisma generate

# Apply migrations to database
npx prisma migrate deploy

# Compile TypeScript
npm run build

# Start production server
npm start
```

### Frontend (Client) Setup
From the `/client` directory:
```bash
# Install dependencies
npm install

# Build static assets (Vite / Rolldown bundling)
npm run build
```

### Development Execution Modes
If executing in development mode:
* **Server**: `npm run dev` (starts `ts-node-dev` server on `http://localhost:5001`)
* **Client**: `npm run dev` (starts Vite dev server on `http://localhost:5173`)

---

## E. Database Migration Notes
The following database migrations exist under `server/prisma/migrations/`:
1. `20260413094218_init` (Core schema setup)
2. `20260606183230_add_student_enrollment_history` (Historic logs schema)
3. `20260606184231_add_fee_payment_allocations` (Allocation ledger schema)
4. `20260608034300_add_email_notification_log` (Email notification audit log)
5. `20260608162632_add_admission_extended_fields` (Admission wizard extended fields)
6. `20260609041541_add_student_document_fields` (Student document storage fields and admission traceability)

### Migration Safeguards
* **Migrate Deployment**: Always use `npx prisma migrate deploy` in UAT, staging, and production environments.
* **No db push**: Never run `npx prisma db push` in production as it can lead to data truncation.
* **No Seeding**: Do not run the seed script on production databases.

---

## F. Seed/Test Users
A local UAT database seed provides the following test credentials:
* **Password for all accounts**: `Admin@123`

```txt
super_admin@school.com (Super Admin)
admin@school.com       (Admin)
principal@school.com   (Principal)
teacher@school.com     (Teacher)
clerk@school.com       (Clerk)
parent@school.com      (Parent)
student@school.com     (Student)
```
> [!IMPORTANT]
> These credentials are for local/UAT demonstration and testing only. They must be removed or disabled before moving to live production.

---

## G. Role Access Summary
* **Super Admin**: Institutional management, multitenant school settings, system configurations, and developer utilities.
* **Admin**: Core management operations (admissions, student enrollments, people management, finance setup, class structures, settings).
* **Principal**: Supervision role. Access to academics, attendance logs, homework, and exams.
* **Clerk**: Operational role. Full access to admissions, student listings, attendance logs, and fee payments. Clerk is restricted from destructive administrative actions (such as settings overrides, roles, or database purging).
* **Teacher**: Classroom operations. Section attendance tracking, homework assignment, grading, and timetables.
* **Parent**: Personal viewport. Viewing linked children profiles, fee transaction receipts, dues ledgers, and attendance analytics.
* **Student**: Personal viewport. Self attendance analysis, homework logs, fee receipts, and exam timetables.

---

## H. Main Features Ready for UAT
1. **Interactive Dashboard**: KPI widgets, live attendance summaries, system logs, notice boards, and student trends.
2. **Sidebar Navigation**: Scoped menu structures matching current active role permissions.
3. **Student Directory**: Profile setups, address details, and roll assignments.
4. **Enrollment History**: Logs student class/section mapping historical records.
5. **Admissions & Enquiries Workspace**: Full pipelines tracking new enquiries, application statuses, and admission transitions to active students.
6. **Attendance & Homework Logs**: Student daily logs and teacher assignment creation portals.
7. **Exams Board**: Schedules and gradebook entry workspace.
8. **Fee Collection Engine**: Component-wise allocation grid, FIFO calculation module, and balance calculators.
9. **Receipt System**: Generates custom PDF receipts showing itemized allocations.
10. **Reports Export**: Dynamic Excel and PDF reports.

---

## I. UAT Test Checklist
- [ ] **Role Login**: Authenticate as all 7 test users.
- [ ] **Sidebar Scoping**: Verify role boundaries (e.g., Student/Parent menu maps vs Admin views).
- [ ] **Create Student**: Fill student profile form and verify student profile creation.
- [ ] **Promote Student**: Promote a student to a different class/section and check that a new active record is created in the enrollment log while the old one closes.
- [ ] **Create Enquiry**: Submit a new enquiry and transition the status.
- [ ] **Admission to Student**: Convert a registered candidate, assign a fee structure, and verify automatic student number allocation.
- [ ] **Daily Attendance**: Mark section attendance and export stats.
- [ ] **Create Notice / Notice board**: Post announcements and verify audience scoping.
- [ ] **Assign Homework**: Create assignments and view them from parent/student accounts.
- [ ] **Fee Collection (Legacy)**: Collect a flat fee payment (no allocations) and confirm it auto-allocates to components using FIFO.
- [ ] **Fee Collection (Itemized)**: Collect payment with custom allocations and check for correct component mappings.
- [ ] **Receipt Generation**: Click on transactions and open itemized receipts.
- [ ] **Student/Parent Portal**: Verify student ledger shows correct balances and payments.
- [ ] **IDOR Protection**: Log in as a student and attempt to retrieve another student's fee details directly via API; confirm it blocks with a `403 Forbidden` response.
- [ ] **Concurrency Locking**: Ensure concurrent payments are processed safely.

---

## J. Finance/Fee Allocation Testing Guide
The fee module supports two collection methods:
1. **Legacy Compatibility**: Submit a flat payment. The allocation engine automatically processes dues based on chronological FIFO logic.
2. **Custom Itemized**: Supply specific allocation amounts per component (e.g., Tuition Fee, Exam Fee).

### Validation Safeguards
* **Overpayment Block**: Attempts to collect more than the overall remaining balance are blocked.
* **Component-Level Dues Block**: Manual allocations cannot exceed outstanding component dues.
* **Balance Check**: Allocation sums must match the absolute `amountPaid`.

---

## K. Security & Safety Fixes Completed
* **JWT Secret Safety**: Hardcoded fallbacks removed. Authenticators read signature secrets directly from environment settings.
* **Clerk Limits**: clerk permissions restricted to operational data. Admin configurations (such as role mappings and settings) are locked.
* **Scoping**: School identification keys scope queries across students, fees, reports, and class settings.
* **IDOR Blockers**: Query permissions validate requests against token scopes to isolate student/parent queries.
* **Mass-assignment Lock**: Checked parameters during profile updates.

---

## L. Known Notes / Non-Blocking Risks
1. **Prisma 7 IDE Datasource Warnings**: VS Code/IDE extensions validate schemas using Prisma 7 guidelines and might flag warnings. The application uses **Prisma 6.19.3**, which requires database properties inside `schema.prisma` for compilation. This has no runtime or deployment impact.
2. **Local File Storage**: Logo branding uploads save locally to `/uploads/`. For production scale-out configurations, configure shared network storage or object stores (S3/GCS).
3. **SMS/Gateway Integration**: SMS dispatchers and payment gateways are mock endpoints. Production deployment will require integration setups.

---

## M. Do Not Do on Staging/Production
* **NO** `npx prisma db push` (use `npx prisma migrate deploy` instead).
* **NO** destructive database seeding.
* **NO** `ALLOW_DB_SEED_RESET=true` (keep false).
* **NO** default password configurations (change admin passwords).
* **NO** public exposure of `.env` configurations.

---

## N. Recommended Next Phase
* Address client feedback loops raised during UAT, or proceed to **Phase 3** (notifications, payment gateway integrations, or live reporting).

---

## O. Final Release Readiness Statement
> **READY FOR UAT / STAGING DEPLOYMENT WITH EMAIL NOTIFICATIONS, ADMISSION WIZARD, DOCUMENT MANAGEMENT, AND SECTION-WISE SUBJECT TEACHER ASSIGNMENT INCLUDED**
>
> The current branch is ready for UAT/staging deployment based on successful build, migration, role login, security scope, fee allocation, parent/student portal revamp, email notification system triggers, admission wizard, document management, and business flow smoke tests. All backend security and duplicate checks pass. TypeScript and production builds are clean across server and client.

---

## P. Phase 2.5: Parent & Student Experience Revamp

### P.1 Summary of Phase 2.5 Changes

| Area | Change |
|---|---|
| Active Student Context | Added `activeStudentId` and `activeStudentName` to Redux auth state and localStorage. Initialized on login for student and parent roles. |
| Parent Child Switcher | Added a child selector dropdown in the TopBar, visible only when the logged-in user is a parent with linked children. |
| Student Context Auto-Init | On student login, `activeStudentId` is automatically set to the student's own ID. No manual selection required. |
| Parent First Child Auto-Select | On parent login, `activeStudentId` is automatically set to the first linked child. Parent can switch via the TopBar selector. |
| Dashboard Improvements | Dashboard widgets for attendance, fees, homework, timetable, exams, and notices are now scoped to the active student/child. Admin-only quick actions are hidden for student/parent roles. |
| Student Fee Page | `StudentFeesPage` now reads `activeStudentId` from Redux to fetch the correct student's fee ledger. |
| Student Attendance Page | `StudentAttendancePage` now reads `activeStudentId` to load the correct attendance records. |
| Timetable Page | For student/parent, timetable automatically resolves the class and section from the active student context. Admin/teacher view retains manual controls. |
| Homework Page | Homework scoped to active student's class/section. Admin create/edit controls hidden for student/parent. |
| Exams / Results Page | Exams filtered by active student's class. Marks entry and admin management controls hidden for student/parent. |
| Notices Page | Notice creation/admin controls hidden for student/parent. Notices remain fully readable. |
| Backend IDOR Strengthening | Student profile, enrollment history, report card, and homework access now enforce strict role-based identity checks. |

### P.2 Files Changed in Phase 2.5

| File | Description |
|---|---|
| `client/src/types/index.ts` | Added `activeStudentId` and `activeStudentName` to `AuthState` type |
| `client/src/features/auth/authSlice.ts` | Added `setActiveStudent` reducer; `setCredentials` now initializes active student context on login; `logout` clears active student context |
| `client/src/hooks/useAuth.ts` | Exposes `activeStudentId` and `activeStudentName` from Redux state |
| `client/src/components/layout/TopBar.tsx` | Added parent child switcher dropdown (parent-role only) that dispatches `setActiveStudent` on selection |
| `client/src/features/dashboard/DashboardPage.tsx` | Role-aware dashboard widgets scoped to `activeStudentId`; imported missing `ApiResponse` type |
| `client/src/features/fees/StudentFeesPage.tsx` | Fee ledger bound to `activeStudentId` for parent and student |
| `client/src/features/students/StudentAttendancePage.tsx` | Attendance records bound to `activeStudentId` |
| `client/src/features/timetable/TimetablePage.tsx` | Auto-resolves class/section from active student for student/parent roles |
| `client/src/features/homework/HomeworkPage.tsx` | Scoped to active student class/section; admin controls hidden for student/parent |
| `client/src/features/exams/ExamsPage.tsx` | Scoped to active student class; admin controls hidden for student/parent |
| `client/src/features/notices/NoticesPage.tsx` | Admin controls hidden for student/parent |
| `server/src/controllers/studentController.ts` | IDOR guard: student can only access own profile and enrollment history; parent can only access linked child |
| `server/src/controllers/examController.ts` | IDOR guard: report card endpoint enforces student self-check and parent-child link check; `studentId` cast fixed |
| `server/src/controllers/moduleController.ts` | IDOR guard: homework query enforces parent-child link verification before serving data |

### P.3 Parent / Student UAT Checklist

#### Parent Account Tests
- [ ] Login as `parent@school.com` / `Admin@123`
- [ ] Verify the **child switcher dropdown** appears in the TopBar
- [ ] Verify only the parent's **linked children** appear in the switcher
- [ ] Switch child and verify the **dashboard** stats change to reflect the selected child
- [ ] Switch child and verify the **Fees** page (`/student/fees`) ledger updates
- [ ] Switch child and verify the **Attendance** page updates
- [ ] Switch child and verify the **Timetable** updates to the correct class/section
- [ ] Switch child and verify the **Homework** list updates to the correct class/section
- [ ] Switch child and verify the **Exams** list updates
- [ ] Verify parent **cannot** access another student's profile directly via the API (expect `403` or `404`)
- [ ] Verify parent **cannot** view an unrelated student's report card (expect `403`)
- [ ] Verify parent **cannot** view an unrelated student's enrollment history (expect `403` or `404`)

#### Student Account Tests
- [ ] Login as `student@school.com` / `Admin@123`
- [ ] Verify the **child switcher does NOT appear** in the TopBar
- [ ] Verify **dashboard** shows the student's own stats (attendance, fees, homework, timetable, exams, notices)
- [ ] Navigate to `/student/fees` — verify own fee ledger loads
- [ ] Navigate to `/student/attendance` — verify own attendance loads
- [ ] Navigate to `/homework` — verify only homework for own class/section is shown
- [ ] Navigate to `/timetable` — verify timetable auto-resolves to own class/section
- [ ] Navigate to `/exams` — verify only relevant exams are shown
- [ ] Navigate to `/notices` — verify notices load (no admin controls visible)
- [ ] Verify student **cannot** access another student's profile (expect `403` or `404`)
- [ ] Verify student **cannot** view another student's report card (expect `403`)
- [ ] Verify student **cannot** view another student's enrollment history (expect `403` or `404`)

### P.4 Security Notes

| Check | Status |
|---|---|
| Parent-child IDOR boundary (profile, history, report card) | ✅ 18/18 API checks PASS |
| Student self-access boundary (own profile, fees, report card) | ✅ PASS |
| Report card endpoint scoped by role | ✅ PASS — student: self only; parent: linked children only |
| Homework endpoint scoped by parent-child link | ✅ PASS |
| Fee payment access scoped | ✅ PASS |
| SchoolId scoping remains intact across all endpoints | ✅ PASS |

### P.5 Known Notes

> [!NOTE]
> **Browser Smoke Test**: Browser automation quota was exhausted during the Phase 2.5 audit. The **parent portal** UI smoke test was completed visually in a prior browser session. The **student portal** UI smoke test was verified via API checks (all auth context fields, role isolation, and IDOR boundaries confirmed). A full visual browser smoke test for the student account should be repeated either manually during UAT or once browser automation is available.

> [!NOTE]
> **UI Screenshots**: Phase 2.5 parent portal screenshots were captured during the prior browser session. Student portal UI screenshots should be captured during formal UAT walkthrough.

### P.6 Phase 2.5 Audit Results

| Check | Result |
|---|---|
| Server `npx tsc --noEmit` | ✅ PASS — 0 errors |
| Server `npm run build` | ✅ PASS |
| Client `npx tsc --noEmit` | ✅ PASS — 0 errors |
| Client `npm run build` | ✅ PASS — Vite bundle built in 1.59s |
| `scripts/audit-test.ts` | ✅ PASS — 14/14 tests |
| `scripts/concurrency-test.ts` | ✅ PASS — unique receipts verified |
| Backend IDOR/security checks | ✅ PASS — 18/18 |
| Commit | `b92c517` → pushed to `origin/Nupun` |

---

## Q. Final Browser UI Screenshot Pass

> Final browser UI screenshot pass completed successfully.

**Automated with**: Playwright (Chromium headless, v1.60.0)  
**Run date**: 2026-06-07  
**Result**: ✅ **44/44 PASS — 0 FAIL — 0 Console Errors**

### Q.1 Roles Tested

| Role | Login | Pages Verified |
|---|---|---|
| Admin | ✅ | Dashboard, Sidebar, Students, Fees, Reports |
| Parent | ✅ | Dashboard, Child Switcher, Fees, Attendance, Timetable, Homework, Exams, Notices |
| Student | ✅ | Dashboard (no child switcher), Fees, Attendance, Timetable, Homework, Exams, Notices |
| Teacher | ✅ | Dashboard, Attendance, Homework, Timetable, Exams |
| Clerk | ✅ | Dashboard, Enquiries, Admissions, Fees, Settings blocked |
| Mobile (375px) | ✅ | Parent Dashboard, Student Fees |
| Tablet (768px) | ✅ | Parent Dashboard |

### Q.2 Screenshots Captured

33 screenshots saved to `test-results/final-uat-screenshots/`:

| File | Description |
|---|---|
| `01-admin-dashboard.png` | Admin dashboard with KPI widgets |
| `02-admin-sidebar.png` | Admin sidebar expanded |
| `03-admin-students.png` | Student list table |
| `04-admin-fees.png` | Fee collection page |
| `05-admin-reports.png` | Reports export page |
| `06-parent-dashboard.png` | Parent dashboard with child stats |
| `07-parent-child-switcher.png` | Parent TopBar with child switcher |
| `07b-parent-child-switcher-open.png` | Child selector dropdown open |
| `08-parent-fees.png` | Parent: linked child fee ledger |
| `08b-parent-attendance.png` | Parent: linked child attendance |
| `08c-parent-timetable.png` | Parent: linked child timetable |
| `08d-parent-homework.png` | Parent: homework (no admin controls) |
| `08e-parent-exams.png` | Parent: exams (no admin controls) |
| `08f-parent-notices.png` | Parent: notices (no admin controls) |
| `09-student-dashboard.png` | Student dashboard — no child switcher |
| `10-student-fees.png` | Student own fee ledger |
| `10b-student-attendance.png` | Student own attendance |
| `10c-student-timetable.png` | Student timetable |
| `10d-student-homework.png` | Student homework |
| `10e-student-exams.png` | Student exams |
| `10f-student-notices.png` | Student notices |
| `11-teacher-dashboard.png` | Teacher dashboard |
| `11b-teacher-attendance.png` | Teacher attendance |
| `11c-teacher-homework.png` | Teacher homework |
| `11d-teacher-timetable.png` | Teacher timetable |
| `11e-teacher-exams.png` | Teacher exams |
| `12-clerk-dashboard.png` | Clerk dashboard |
| `12b-clerk-enquiries.png` | Clerk enquiries page |
| `12c-clerk-admissions.png` | Clerk admissions page |
| `12d-clerk-fees.png` | Clerk fee collection page |
| `13-mobile-parent-dashboard.png` | Mobile (375px) parent dashboard |
| `13b-mobile-student-fees.png` | Mobile (375px) student fees |
| `13c-tablet-parent-dashboard.png` | Tablet (768px) parent dashboard |

### Q.3 Issues Found and Fixed

| # | Issue | Severity | Fix Applied |
|---|---|---|---|
| 1 | Clerk could access `/settings` page — frontend permissions not aligned with Phase 2.1A HIGH-02 backend restriction | **Medium** | Removed `SETTINGS_VIEW`, `SETTINGS_UPDATE`, `ROLE_VIEW`, `ROLE_MANAGE` from clerk's `ROLE_PERMISSIONS` in `constants.ts` |
| 2 | `SettingsPage` had no frontend role guard — any authenticated user could navigate directly to `/settings` | **Medium** | Added `useEffect` role guard to `SettingsPage.tsx`: redirects non-admin/super_admin to `/dashboard` |
| 3 | `school.board`, `school.principalName`, `school.website` inputs showed React `null value prop` console warning | **Low** | Added `\|\| ''` null-safe fallbacks on those controlled input fields |

### Q.4 Verification Checks

| Check | Result |
|---|---|
| No blank pages | ✅ PASS |
| No console errors | ✅ PASS — 0 errors after fixes |
| No broken sidebar links | ✅ PASS |
| No layout overflow on desktop | ✅ PASS |
| Parent child switcher works | ✅ PASS |
| Student portal — no child switcher | ✅ PASS |
| Admin/teacher/clerk unaffected by student context | ✅ PASS |
| Clerk `/settings` blocked/redirected | ✅ PASS |
| Mobile 375px layout | ✅ PASS |
| Tablet 768px layout | ✅ PASS |
| Client `npx tsc --noEmit` after fixes | ✅ PASS — 0 errors |

---

## R. Phase 2.6: Email Notification System

### R.1 Summary
The School ERP now includes a backend email notification infrastructure and event-triggered email flows for key school events. Emails are disabled/test-mode by default and all email dispatches are designed as fire-and-forget, ensuring failure to send does not block core ERP operations.

### R.2 Email Infrastructure Added
The notification system is backed by the following architecture:
- `EmailService`: Low-level SMTP transport layer wrapping Nodemailer, providing event log creation, and duplicate prevention.
- `NotificationService`: High-level orchestrator class directing queries, batch processing, and templates compilation for each event.
- `emailTemplates`: Curated HTML and plain-text template mappings with premium CSS styling.
- `emailHelpers`: Utility methods for address formatting, synthetic domain detection, and masking.
- `EmailNotificationLog`: Database table recording the logs and execution state of every notification dispatch.
- **SMTP Environment Variables**: Support for host, port, credentials, and custom sender aliases.
- **Diagnostics Script**: Developer script to verify SMTP transport and database log creations.
- **Disabled/Test Modes**: Toggle to prevent real SMTP connections and write mock logs.
- **Synthetic Email Skipping**: Skips transport and writes a skipped log for mock domains ending with `@school.local`.
- **Duplicate Prevention**: Time-window (30 seconds) suppression utilizing metadata combinations.

### R.3 Environment Variables
Configure the following options in your `.env` configuration file:
```env
EMAIL_ENABLED=false
EMAIL_PROVIDER=smtp
EMAIL_TEST_MODE=true
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=noreply@school.local
SMTP_FROM_NAME=School ERP
```
> [!WARNING]
> - Never commit SMTP username and password credentials to git.
> - Local/UAT environments should keep `EMAIL_TEST_MODE=true` to skip SMTP connections and avoid API performance blocks.
> - Production should run with real SMTP credentials only after strict approval.
> - `.env.example` contains safe placeholder defaults.

### R.4 Email Events Implemented

#### Admission and Account Management
- **Admission application submitted**: Notifies parents of application receipt.
- **Admission approved**: Notifies parents of admission approval and next steps.
- **Admission rejected**: Sends rejection and feedback/remarks.
- **Student enrolled**: Welcomes parents and student and sends portal credentials.
- **Teacher welcome**: Welcomes teacher and sends employee login credentials.
- **Staff welcome**: Welcomes operational staff/clerk and sends credentials.
- **Student password reset**: Sends updated student temporary password.
- **Teacher password reset**: Sends updated teacher temporary password.
- **Staff password reset**: Sends updated staff temporary password.

#### Academic and Communication Updates
- **Notice published**: Dispatches notices to target audience roles (Admin/Staff/Teacher/Parent/Student).
- **Homework assigned**: Informs students and parents of new class/section homework and deadlines.
- **Exam scheduled**: Notifies students and parents of upcoming class exams.
- **Exam date changed**: Sends Old vs New dates comparison tables for rescheduled exams.
- **Result/marks published**: Sends grades and scorecards securely.

#### Finance and Attendance
- **Fee payment receipt**: Generates a fee payment receipt containing transaction parameters, itemized component allocations, and balance due.
- **Attendance absent alert**: Sends daily alerts to parents of absent students.

### R.5 Email Safety Rules
- **Fire-and-Forget**: All emails run asynchronously. Failure to send cannot block or roll back database transactions.
- **No Block on Business API**: If the SMTP host is unreachable, the ERP business flow succeeds.
- **Synthetic Email Suppression**: Addresses ending with `@school.local` write a log with status `skipped` and skip transport.
- **No SMTP in Test Mode**: Prevents connections to real hosts when `EMAIL_TEST_MODE=true`.
- **Seed Safety Guard**: Seeding completely skips logs and emails when `SEEDING=true`.
- **Deduplication Suppression**: Filters out duplicate notifications inside a 30-second window based on unique identifiers (e.g. `paymentId`, `studentId + attendanceDate`).
- **School Tenant Boundaries**: Verifies matching `schoolId` to guarantee no cross-tenant leakage.

### R.6 Email Log Table
The `EmailNotificationLog` table stores execution details for auditing:
- `recipientEmail`: Targeted recipient.
- `recipientUserId`: User model identifier.
- `recipientRole`: Audience role (e.g., student, parent).
- `eventType`: Type of trigger event.
- `subject`: Email subject line.
- `status`: Execution status (`test`, `sent`, `skipped`, or `failed`).
- `errorMessage`: Exception details.
- `metadata`: JSON payload containing reference IDs (e.g., `paymentId`, `attendanceDate`).
- `schoolId`: Tenant boundary scope.
- `sentAt` / `createdAt`: Timestamps.

### R.7 UAT Email Testing Checklist
- [ ] Set `EMAIL_ENABLED=true` and `EMAIL_TEST_MODE=true` in server environment.
- [ ] Submit an admission application and verify the log for application submission.
- [ ] Approve the application and verify the approval log.
- [ ] Reject an application and verify the rejection log.
- [ ] Enroll an approved candidate and verify student/parent credentials logs.
- [ ] Register a teacher/staff and verify welcome credentials logs.
- [ ] Reset a user's password and verify the reset log.
- [ ] Publish an administrative notice and check role-targeted user logs.
- [ ] Post homework and verify class/section student/parent logs.
- [ ] Schedule an exam and verify logs.
- [ ] Reschedule an exam date and verify the old/new dates changes log.
- [ ] Publish exam results and verify isolated scorecard logs.
- [ ] Collect a flat fee payment and verify receipt log generation.
- [ ] Mark a student absent and verify the parent absence alert log.
- [ ] Run seed database reset and verify exactly **0** logs are generated.
- [ ] Confirm no external SMTP calls are sent in test mode.

### R.8 Commands for Email Testing
Run E2E verification test suites using:
```bash
cd server

# Diagnose general Nodemailer setup
EMAIL_ENABLED=true EMAIL_TEST_MODE=true npm run test-email -- test@example.com

# Verify admission & account triggers
EMAIL_ENABLED=true EMAIL_TEST_MODE=true npx ts-node --transpile-only scripts/test-triggers.ts

# Verify notice, homework, exam & result triggers
EMAIL_ENABLED=true EMAIL_TEST_MODE=true npx ts-node --transpile-only scripts/test-academic-emails.ts

# Verify fee receipt & absent alert triggers
EMAIL_ENABLED=true EMAIL_TEST_MODE=true npx ts-node --transpile-only scripts/test-fee-attendance-emails.ts
```

To test seed safety:
```bash
mysql -h 127.0.0.1 -u root -pAmroy@123 -D school_erp -e "delete from email_notification_logs;"
EMAIL_ENABLED=true EMAIL_TEST_MODE=true npm run seed
mysql -h 127.0.0.1 -u root -pAmroy@123 -D school_erp -e "select count(*) as emailLogCount from email_notification_logs;"
```
Expected output: `emailLogCount = 0`.

### R.9 Not Implemented Yet / Future Scope
- **Fee Due Reminders**: Scheduled reminders for pending/partial fees are not implemented.
- **Overdue Reminders**: Automatic overdue warnings are not implemented.
- **Low Attendance Alerts**: Threshold warnings for low attendance are not implemented.
- **Scheduler / Cron Jobs**: No scheduler task or background daemon runs in this phase.
- **Email Settings UI**: Frontend configurations for email preferences are not implemented.
- **Editable Email Templates**: No custom template editors are available.
- **Production SMTP**: Real sending requires configuration of production mailservers.

### R.10 Final Status
> **READY FOR UAT / STAGING DEPLOYMENT WITH EMAIL NOTIFICATIONS, ADMISSION WIZARD, DOCUMENT MANAGEMENT, AND SECTION-WISE SUBJECT TEACHER ASSIGNMENT INCLUDED**

---

## S. Phase 2.7: Admission and Student Document Management

### S.1 Summary

Phase 2.7 delivers a complete admission and student document management pipeline:

1. **Admission Wizard**: The admission form has been revamped from a single-page form into a guided 6-step wizard with logical grouping, progress indicators, and step validation.
2. **Admission Document Upload**: During or after admission creation, documents can be uploaded and managed from the Admission Details modal. Documents are stored securely in private server storage.
3. **Student Document Fields**: The Student model now has dedicated fields for 6 document types, enabling direct document management on student records.
4. **Document Copy on Conversion**: When an admission is converted to a student, all uploaded admission documents are physically copied into the student's private storage. The original admission documents are preserved.
5. **Student Profile Documents Tab**: The Student Profile page now includes a Documents tab where administrators can view, upload, download, replace, and delete student documents — whether the student was created directly or converted from an admission.

### S.2 Admission Wizard (Phase 2.7C)

The admission form is now a guided wizard with 6 steps:

| Step | Name | Fields |
|---|---|---|
| 1 | **Student Information** | First name, middle name, last name, date of birth, gender, blood group, religion, category, nationality, mother tongue, Aadhaar number |
| 2 | **Academic Details** | Class applied for, section, academic year, previous school, previous board, last class attended, previous marks, transfer certificate number, admission source |
| 3 | **Parent Details** | Father name/phone/email/occupation/qualification/income/Aadhaar/office address, Mother name/phone/email/occupation/qualification/income/Aadhaar/office address |
| 4 | **Guardian & Address** | Guardian relationship/occupation/address, emergency contact name/phone, current address (street/city/state/pincode), permanent address (street/city/state/pincode) |
| 5 | **Documents** | Upload area for 6 document types (after admission creation) |
| 6 | **Fee Assignment & Review** | Assign fee structures, set custom amounts, review full application summary |

### S.3 Admission Documents (Phase 2.7D)

#### Supported Document Types

| Document Type Key | Display Name | Description |
|---|---|---|
| `studentPhoto` | Student Photo | Recent passport size photo of the student |
| `birthCertificateDoc` | Birth Certificate | Official government-issued certificate |
| `studentAadhaarDoc` | Student Aadhaar Card | UIDAI Aadhaar Card of the student |
| `parentAadhaarDoc` | Parent/Guardian Aadhaar Card | UIDAI Aadhaar Card of primary parent/guardian |
| `transferCertificateDoc` | Transfer Certificate / LC / TC | School Leaving/Transfer Certificate |
| `previousMarksCardDoc` | Previous Marksheet | Marks card from the last attended class/school |

#### Behavior
- Documents can be uploaded **after** admission creation (not during initial form submission).
- Documents can be uploaded, viewed, downloaded, replaced, and deleted from the **Admission Details modal**.
- **Documents are not mandatory** — missing documents do not block admission creation, approval, or conversion.
- **Allowed file types**: PDF, JPG/JPEG, PNG.
- **Maximum file size**: 5MB per file.
- Files are stored in `server/private_uploads/admissions/` with unique timestamped filenames.

### S.4 Student Documents (Phase 2.7E)

#### Student Profile Documents Tab
- The Student Profile page now includes a **Documents** tab alongside Overview, Academic, Attendance, Fees & Finance, and Leaves.
- The Documents tab displays 6 document cards (same types as admission documents).
- Each card shows:
  - Document name and description
  - Status badge: **Uploaded** (green) or **Missing** (orange)
  - File name when uploaded
  - Accepted format and size limits
- Actions available per document:
  - **Upload File** — when no document exists
  - **View / Download** — opens or downloads the document
  - **Replace** — overwrites with a new file (old file is deleted from disk)
  - **Delete** — removes the file and clears the database reference
- For students converted from an admission, a **"Created from Admission"** badge is displayed with the source admission ID.

#### Document Sources
- **Direct students** (added via Add Student): Documents can be uploaded from the Student Profile Documents tab.
- **Converted students** (from admission): Documents are automatically copied during conversion. Additional documents can be uploaded or replaced afterward.

### S.5 Security

| Security Measure | Implementation |
|---|---|
| **Private storage** | Documents stored in `server/private_uploads/admissions/` and `server/private_uploads/students/` — not exposed via any public static file route |
| **No public URL** | No `/uploads/` URL serves admission or student documents directly |
| **Authenticated endpoints only** | All document upload/download/delete routes require valid JWT authentication |
| **School-scoped access** | Document endpoints verify the student/admission belongs to the authenticated user's school |
| **Permission-checked access** | Upload/replace/delete require `student:update` or `admission:update` permission; download requires `student:view` or `admission:view` |
| **Path traversal protection** | Document type keys are validated against a whitelist; arbitrary file paths cannot be injected |
| **File type validation** | Server-side MIME type and extension checks reject invalid uploads |
| **File size validation** | Server-side 5MB limit enforced via Multer configuration |
| **Old file cleanup** | When replacing a document, the old file is deleted from disk before the new file reference is saved |

### S.6 Admission to Student Conversion — Document Copy

When an admission is converted to a student via the "Convert to Student" action:

1. **Physical file copy**: Each admission document file is physically copied from `server/private_uploads/admissions/` to `server/private_uploads/students/` with a new unique filename.
2. **Original preserved**: The original admission document files are **not** deleted or modified.
3. **Independent copies**: Student documents are fully independent — deleting or replacing a student document does not affect the source admission document.
4. **Traceability**: The student record stores `sourceAdmissionId` linking back to the originating admission.
5. **Optional files**: Missing admission documents are silently skipped — they do not block conversion.
6. **Orphan cleanup**: If the database transaction fails after file copy, any copied student files are cleaned up (best-effort) to avoid orphaned files on disk.
7. **Database format**: Only the filename (basename) is stored in the database, matching the format used by the student document upload endpoints.

### S.7 UAT Test Checklist — Document Management

#### Admission Document Tests
- [ ] Create a new admission using the guided wizard.
- [ ] After creation, open the Admission Details modal.
- [ ] Upload a Student Photo (JPG/PNG).
- [ ] Upload a Birth Certificate (PDF).
- [ ] Verify uploaded documents show "Uploaded" badge and filename.
- [ ] View/download an uploaded admission document.
- [ ] Replace an uploaded admission document with a new file.
- [ ] Delete an uploaded admission document.
- [ ] Verify deleted document shows "Missing" badge.
- [ ] Attempt to upload an invalid file type (e.g., .txt) — verify rejection.
- [ ] Attempt to upload a file over 5MB — verify rejection.

#### Admission to Student Conversion Tests
- [ ] Approve an admission that has uploaded documents.
- [ ] Convert the approved admission to a student.
- [ ] Open the newly created student's profile.
- [ ] Navigate to the Documents tab.
- [ ] Verify all admission documents appear as copied student documents with "Uploaded" badges.
- [ ] Verify the "Created from Admission" badge is visible with the source admission ID.
- [ ] View/download a copied student document — verify it opens correctly.

#### Direct Student Document Tests
- [ ] Add a student directly (not from admission conversion).
- [ ] Open the student's profile and navigate to the Documents tab.
- [ ] Verify all 6 document cards show "Missing" badges initially.
- [ ] Upload a document from the Student Profile Documents tab.
- [ ] Verify the uploaded document shows "Uploaded" badge and filename.
- [ ] View/download the uploaded student document.
- [ ] Replace the uploaded student document with a new file.
- [ ] Delete a student document — verify it shows "Missing" again.

#### Existing Feature Regression
- [ ] Verify existing student tabs (Overview, Academic, Attendance, Fees & Finance, Leaves) still work correctly.
- [ ] Verify Add Student flow is unaffected.
- [ ] Verify student list/search/filter is unaffected.
- [ ] Verify admission list/approve/reject flow is unaffected.

### S.8 Not Mandatory / Future Scope

- **Documents are not mandatory**: No document is required for admission creation, approval, conversion, or student enrollment. Mandatory document rules can be configured in a future phase if required.
- **Separate father/mother Aadhaar fields**: Currently a single `parentAadhaarDoc` field stores one parent/guardian Aadhaar document. Separate fields for father and mother Aadhaar cards can be added later if needed.
- **Cloud storage**: Documents are currently stored on the local server filesystem. For production deployments requiring distributed storage, cloud object storage (AWS S3, Google Cloud Storage, etc.) can be integrated as a future enhancement.
- **Document expiry/versioning**: Document version history and expiry tracking are not implemented. These can be added if required.
- **Bulk document export**: Exporting all documents for a class or batch is not implemented. This can be added as a reporting feature.

### S.9 Files Changed in Phase 2.7

#### Schema & Migration
| File | Description |
|---|---|
| `server/prisma/schema.prisma` | Added extended admission fields (2.7B), student document fields and `sourceAdmissionId` relation (2.7E-B) |
| `20260608162632_add_admission_extended_fields` | Migration for admission wizard extended fields |
| `20260609041541_add_student_document_fields` | Migration for student document fields and source admission traceability |

#### Backend
| File | Description |
|---|---|
| `server/src/controllers/admissionDocumentController.ts` | Admission document upload/download/delete controllers |
| `server/src/controllers/studentDocumentController.ts` | Student document upload/download/delete controllers |
| `server/src/middleware/uploadMiddleware.ts` | Added admission and student document Multer configurations with file type/size validation |
| `server/src/routes/admissionRoutes.ts` | Added admission document routes |
| `server/src/routes/studentRoutes.ts` | Added student document routes |
| `server/src/services/AdmissionService.ts` | Updated `convertToStudent()` to copy admission documents to student storage with orphan cleanup |

#### Frontend
| File | Description |
|---|---|
| `client/src/features/admissions/AdmissionFormPage.tsx` | Revamped into 6-step guided wizard |
| `client/src/features/admissions/AdmissionsListPage.tsx` | Added document upload/view/download/delete in Admission Details modal |
| `client/src/features/admissions/admissionApi.ts` | Admission document API helpers |
| `client/src/features/students/StudentProfilePage.tsx` | Added Documents tab with 6 document cards |
| `client/src/features/students/studentApi.ts` | Student document API helpers |
| `client/src/types/index.ts` | Added student document fields and `sourceAdmissionId` to Student interface |

#### Test Scripts
| File | Description |
|---|---|
| `server/scripts/test-admission-document-upload.ts` | Admission document backend E2E tests (9 tests) |
| `server/scripts/test-student-document-upload.ts` | Student document backend E2E tests (9 tests) |
| `server/scripts/test-admission-to-student-document-copy.ts` | Admission-to-student document copy E2E tests |

### S.10 Phase 2.7 Verification Results

| Check | Result |
|---|---|
| Server `npx tsc --noEmit` | ✅ PASS — 0 errors |
| Server `npm run build` | ✅ PASS |
| Client `npx tsc --noEmit` | ✅ PASS — 0 errors |
| Client `npm run build` | ✅ PASS |
| `test-admission-document-upload.ts` | ✅ PASS — 9/9 tests |
| `test-student-document-upload.ts` | ✅ PASS — 9/9 tests |
| `test-admission-to-student-document-copy.ts` | ✅ PASS |
| `test-extended-fields.ts` (regression) | ✅ PASS |
| `test-triggers.ts` (regression) | ✅ PASS |
| `audit-test.ts` (regression) | ✅ PASS |
| Browser UI — Documents tab renders | ✅ PASS — 6 document cards visible |
| Commits | `aa48896` → `fd44aa3` — pushed to `origin/Nupun` |

### S.11 Final Status
> **READY FOR UAT / STAGING DEPLOYMENT WITH EMAIL NOTIFICATIONS, ADMISSION WIZARD, DOCUMENT MANAGEMENT, AND SECTION-WISE SUBJECT TEACHER ASSIGNMENT INCLUDED**

---

## T. Phase 2.8: Section-wise Subject Teacher Assignment

### T.1 Summary
Earlier, subject-to-teacher assignment was class-level only (one teacher per subject per class). In Phase 2.8, the system was upgraded to support section-wise subject teacher assignments, allowing different teachers to teach the same subject to different sections of the same class.
- **Example**:
  - Class 9 - Section A - Mathematics - Teacher A
  - Class 9 - Section B - Mathematics - Teacher B
  - Class 9 - Section C - Mathematics - Teacher C
- **Fallback**: The primary/class-level teacher remains configured as the fallback option. If no section-specific teacher is assigned to a section, the system automatically falls back to the primary/class-level teacher assignment.

### T.2 Backend Support
- **Junction Model**: Introduced the `SubjectTeacher` model in Prisma to record section-wise subject teacher assignments linking `Subject`, `Section`, and `Teacher`.
- **Subject APIs**: Updated the create/update endpoints for subjects to support the payload format:
  ```ts
  assignments?: Array<{
    sectionId: string;
    teacherId?: string | null;
  }>
  ```
- **Syllabus Retrieval**: Updated the `getSubjects` API logic to load and return `subjectTeachers` relation details with nested sections and teacher profile details.
- **Homework Authorization**: Updated verification checks so that teachers are authorized to assign homework if they are assigned to that subject either section-wise for the target section, or class-wide via the fallback primary teacher.
- **Teacher Dashboard**: Updated the dashboard statistics counting logic to dynamically scan both class-level and section-wise assignments for the logged-in teacher.

### T.3 Subject UI
- **Add/Modify Modal**: Form modal on the Curriculum Management/Subjects page dynamically fetches and displays the sections for the selected Class. For each section, a teacher selection dropdown is rendered, defaulting to `"Use Fallback Teacher"`.
- **List Display**: The subject table lists the primary teacher as the fallback (e.g. `Primary: Teacher Name`), and displays a clean list of section-wise assignments below it (e.g. `Sec A: Teacher A`, `Sec B: Teacher B`).

### T.4 Timetable/Homework Behavior
- **Timetable Builder**: Selecting a subject for a timetable slot automatically resolves and selects the correct teacher based on the selected class, section, and subject-section teacher assignments. A helper message `Teacher auto-selected based on selected section assignment.` is displayed under the dropdown.
- **Homework Modal**: Creating homework prompts the user with class and section contexts. Once a subject is selected, it displays either the section-specific assigned teacher or falls back to the class-level primary teacher. Teachers are filtered so they can only assign homework to sections they actually teach.

### T.5 UAT Test Checklist
- [ ] **Primary Fallback Verification**: Create a subject with a primary teacher only (leaving section-wise assignments blank) and save it. Verify fallback teacher displays.
- [ ] **Section Assignments Creation**: Create a subject with Section A assigned to Teacher A, and Section B assigned to Teacher B. Save and verify assignments show on the subject list.
- [ ] **Modify Assignment**: Open the Edit modal, change a section-wise teacher assignment, and save it. Re-open the modal and verify the change persists.
- [ ] **Timetable Auto-Select (Sec A)**: Open the timetable builder for Class 9 Section A, add the subject, and verify Teacher A is auto-selected.
- [ ] **Timetable Auto-Select (Sec B)**: Open the timetable builder for Class 9 Section B, add the subject, and verify Teacher B is auto-selected.
- [ ] **Homework Creation**: Assign homework for Section A and verify it saves successfully under the correct teacher context.
- [ ] **Teacher Role Authorization**: Log in as a teacher and verify they can only assign homework to sections they are assigned to teach.
- [ ] **Backward Compatibility**: Verify older subjects without section-wise assignments still render and work correctly.

### T.6 Security/Validation
- **Unique Constraint**: The junction table enforces a unique constraint on `[subjectId, sectionId]`, blocking duplicate assignments.
- **Class Match Validation**: Section IDs are validated to ensure they belong to the selected class.
- **Cross-School Block**: Domain queries verify school boundaries, preventing cross-school edits.

### T.7 Not Mandatory / Future Scope
- **Optional Use**: Section-wise assignments are optional. Schools can continue assigning one teacher at the class level if desired.
- **Timetable Conflicts**: Automatic conflict checking for section-wise teachers in timetable grid entries can be expanded.
- **Teacher Workload Reports**: Future live stats of teacher periods across sections can be added.

### T.8 Files Changed in Phase 2.8
- `client/src/types/index.ts` (Subject Doc types)
- `client/src/features/subjects/SubjectsPage.tsx` (Curriculum management UI)
- `client/src/features/timetable/TimetablePage.tsx` (Timetable auto-select logic)
- `client/src/features/homework/HomeworkPage.tsx` (Homework dropdown filtering and helpers)
- `server/src/controllers/studentController.ts` (Collision/deduplication checks on Excel student imports)

### T.9 Phase 2.8 Verification Results

| Check | Result |
|---|---|
| Server `npx tsc --noEmit` | ✅ PASS — 0 errors |
| Server `npm run build` | ✅ PASS |
| Client `npx tsc --noEmit` | ✅ PASS — 0 errors |
| Client `npm run build` | ✅ PASS |
| `test-section-subject-teachers.ts` | ✅ PASS |
| `test-triggers.ts` (regression) | ✅ PASS |
| `audit-test.ts` (regression) | ✅ PASS |
| `concurrency-test.ts` (regression) | ✅ PASS |
| Timetable Auto-Selection Test | ✅ PASS |
| Homework Dropdown Filtering Test | ✅ PASS |
| Commits | Pushed to `origin/Nupun` |

### T.10 Final Status
> **READY FOR UAT / STAGING DEPLOYMENT WITH EMAIL NOTIFICATIONS, ADMISSION WIZARD, DOCUMENT MANAGEMENT, AND SECTION-WISE SUBJECT TEACHER ASSIGNMENT INCLUDED**

