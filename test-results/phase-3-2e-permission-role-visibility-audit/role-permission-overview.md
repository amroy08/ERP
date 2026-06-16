# Phase 3.2E — Role & Permission System Overview

**Audit Date:** 2026-06-16  
**Branch:** Nupun  
**Commit baseline:** c36e7bf35c107055fd4516801db5cafdeb210c76  
**Test result:** 76/76 PASS

---

## Role Model

| Role | Code | Scope |
|------|------|-------|
| Super Admin | `super_admin` | All permissions across all schools |
| Admin | `admin` | Full school management |
| Principal | `principal` | View/report, exam create, notice create |
| Teacher | `teacher` | Own classes/sections/subjects, homework, marks |
| Clerk (Staff) | `clerk` | Students, fees, attendance mark, admissions, view-only academic |
| Parent | `parent` | Linked children only |
| Student | `student` | Own records only |

## Permission System

- **`protect` middleware** (`authMiddleware.ts`): JWT verification + active user check. Applied to all routes.
- **`authorize(...permissions)` middleware** (`rbacMiddleware.ts`): Checks `ROLE_PERMISSIONS[role]` contains all required permissions.
- **`requireRoles(...roles)` middleware** (`rbacMiddleware.ts`): Hard role whitelist guard.
- **`checkModuleEnabled(moduleName)` middleware** (`moduleMiddleware.ts`): Checks school's `enabledModules` array; defaults to enabled if null.
- **Controller-level scope checks**: Each controller function independently validates:
  - Student: `userId` match → own records only
  - Parent: `getParentLinkedStudentOrThrow()` → linked children only
  - Teacher: `classTeacherOf` / `assignedClasses` / `subjectTeachers` → assigned scope only
  - School: `schoolId` cross-check → prevents cross-school data access

## Permission Matrix (Key Academic Modules)

| Permission | super_admin | admin | principal | teacher | clerk | parent | student |
|-----------|:-----------:|:-----:|:---------:|:-------:|:-----:|:------:|:-------:|
| exam:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| exam:create | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| exam:marks_entry | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| homework:view | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| homework:create | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| attendance:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| attendance:mark | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| timetable:view | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| timetable:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> Note: `homework:view` on student/parent routes does NOT grant access to admin-level submission lists or review endpoints. Those are additionally guarded by controller-level role checks (`role === 'student' || role === 'parent'` → 403).

## Mobile Route Security

All `/api/mobile/*` routes are protected by `router.use(protect)`.  
Each controller function independently checks `req.user.role`:
- `/mobile/student/*` — requires `role === 'student'`
- `/mobile/teacher/*` — requires `role === 'teacher'`
- `/mobile/parent/*` — requires `role === 'parent'`

Cross-role mobile access (e.g., teacher hitting `/mobile/student/dashboard`) returns **403 Access Denied**.
