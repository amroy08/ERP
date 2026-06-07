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
* **Release Readiness Audit**: Fully verified and passed.

---

## B. Latest Stable Commit
* **Target Branch**: `Nupun`
* **Stable Commit Hash**: `5ad0fa89af152be62dd8849bc1a266f50c796ed7`
* **Commit Message**: `Stabilize production build after Phase 2.4 fee allocation`
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
* **Phase 2.5: Parent & Student Experience Revamp** (or address client feedback loops during UAT).

---

## O. Final Release Readiness Statement
> The current branch is ready for UAT/staging deployment based on successful build, migration, role login, security scope, fee allocation, and business flow smoke tests.
