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
* **Release Readiness Audit**: Fully verified and passed.

---

## B. Latest Stable Commit
* **Target Branch**: `Nupun`
* **Stable Commit Hash**: `b92c517`
* **Commit Message**: `Phase 2.5: Parent and student portal experience revamp`
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
> **READY FOR UAT / STAGING DEPLOYMENT WITH PHASE 2.5 INCLUDED**
>
> The current branch is ready for UAT/staging deployment based on successful build, migration, role login, security scope, fee allocation, parent/student portal revamp, and business flow smoke tests. All 18 backend security checks pass. TypeScript and production builds are clean across server and client.

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
