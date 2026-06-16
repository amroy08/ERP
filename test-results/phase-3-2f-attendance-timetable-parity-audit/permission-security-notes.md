# Phase 3.2F — Permission & Security Notes
**Branch:** Nupun  
**Audit Date:** 2026-06-16  
**Baseline Commit:** 5321ef56fb490fd7bbb185185e501d839e7ac04c  

---

## Overview

This document records the permission and IDOR (Insecure Direct Object Reference)  
security audit for Attendance and Timetable mobile endpoints in Phase 3.2F.  
All 76 role-visibility assertions passed via `server/scripts/test-role-visibility-permission-audit.ts`.

---

## Attendance Endpoint Security

### `GET /mobile/attendance`

| Role | Access Rule | Verified |
|---|---|---|
| `student` | Returns only own attendance records (`studentId = authUser.id`) | ✅ |
| `parent` | Returns only child's records (via `parentId → children`) | ✅ |
| `teacher` | Blocked — use teacher endpoint | ✅ |
| Unauthenticated | 401 Unauthorized | ✅ |

### `GET /mobile/teacher/attendance`

| Role | Access Rule | Verified |
|---|---|---|
| `teacher` | Returns attendance for their assigned class only | ✅ |
| `student` | 403 Forbidden | ✅ |
| `parent` | 403 Forbidden | ✅ |
| Unauthenticated | 401 Unauthorized | ✅ |

### `POST /mobile/teacher/attendance`

| Role | Access Rule | Verified |
|---|---|---|
| `teacher` | Can mark attendance only for their assigned class | ✅ |
| `student` | 403 Forbidden | ✅ |
| `parent` | 403 Forbidden | ✅ |
| Cross-school write attempt | Rejected (schoolId from JWT) | ✅ |

---

## Timetable Endpoint Security

### `GET /mobile/timetable`

| Role | Access Rule | Verified |
|---|---|---|
| `student` | Returns timetable for own enrolled class only | ✅ |
| `parent` | Returns timetable for child's enrolled class only | ✅ |
| `teacher` | Blocked — use teacher endpoint | ✅ |
| Unauthenticated | 401 Unauthorized | ✅ |

### `GET /mobile/teacher/timetable`

| Role | Access Rule | Verified |
|---|---|---|
| `teacher` | Returns only periods where `teacherId = authUser.id` | ✅ |
| `student` | 403 Forbidden | ✅ |
| `parent` | 403 Forbidden | ✅ |
| Unauthenticated | 401 Unauthorized | ✅ |

---

## IDOR Mitigation

All queries are scoped by **two layers**:
1. **`schoolId`** — derived from the JWT token via `getSchoolScope(req)`, never from query params.
2. **Role-specific ID** — `studentId`, `teacherId`, or `parentId` from `req.user`, never from request body or query string.

This means a student cannot query another student's attendance by guessing their ID — the server always uses the authenticated user's own ID.

---

## Test Results Reference

Script: `server/scripts/test-role-visibility-permission-audit.ts`  
Run result: **76/76 assertions PASS**  
Categories tested:
- Student isolation (own records only)
- Parent-child scoping
- Teacher class-level scoping
- Cross-role access rejection
- Cross-school isolation
- Unauthenticated access rejection
