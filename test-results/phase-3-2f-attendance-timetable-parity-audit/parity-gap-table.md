# Phase 3.2F — Parity Gap Table
**Branch:** Nupun  
**Audit Date:** 2026-06-16  
**Status:** All gaps FIXED ✅

---

## Confirmed Parity Gaps Found and Fixed

| # | Feature | Gap Description | Root Cause | Fix Applied | Status |
|---|---|---|---|---|---|
| 1 | Attendance (all roles) | Date queries miss records across UTC offset | `new Date(dateStr)` interprets bare date in server TZ | `parseDateToUtcDayRange()` helper with UTC midnight range | ✅ FIXED |
| 2 | Mobile Teacher Attendance | "Today" shows wrong calendar date before 05:30 AM IST | `new Date().toISOString().split('T')[0]` gives UTC date | `toLocaleDateString('en-CA')` gives device-local YYYY-MM-DD | ✅ FIXED |
| 3 | Timetable (all roles) | Period numbers missing / inconsistent with web | `TimetableEntry` has no `periodNumber` field in DB | Sort by `startTime`, assign `Period ${idx+1}` labels in API response | ✅ FIXED |

---

## No-Gap Confirmations

| Feature | Web Console | Mobile | Sync Status |
|---|---|---|---|
| Attendance read (student) | `/api/attendance` | `/mobile/attendance` | ✅ Same DB, same records |
| Attendance read (parent) | `/api/attendance?childId=…` | `/mobile/attendance` (role-scoped) | ✅ Same DB, same records |
| Attendance mark (teacher) | `/api/attendance` (POST) | `/mobile/teacher/attendance` (POST) | ✅ Both write to same table |
| Attendance stats | `/api/attendance/stats` | `/mobile/teacher/attendance/stats` | ✅ Consistent after UTC fix |
| Timetable (student) | `/api/timetable` | `/mobile/timetable` | ✅ Same DB, period order now matches |
| Timetable (teacher) | `/api/timetable?teacher=…` | `/mobile/teacher/timetable` | ✅ Same DB, period order now matches |
| Timetable (parent) | `/api/timetable?class=…` | `/mobile/timetable` (parent role) | ✅ Same DB, period order now matches |
| Role isolation | Auth middleware | JWT `role` + `getSchoolScope` | ✅ 76/76 security assertions pass |
| Cross-school isolation | `schoolId` scoping | `schoolId` from JWT | ✅ No cross-tenant leakage |

---

## Items NOT in Scope (Phase 3.2F)

| Item | Reason |
|---|---|
| Homework parity | Completed in Phase 3.2B ✅ |
| Exam / Marks parity | Completed in Phase 3.2C ✅ |
| Full Academic Sync | Completed in Phase 3.2D ✅ |
| Permission/Role Visibility | Completed in Phase 3.2E ✅ |
| New features | No new features — fix-only phase |
| Prisma schema changes | Explicitly excluded by user |
| Migrations | Explicitly excluded by user |
| APK / EAS build | Explicitly excluded by user |
