# Phase 3.2E — Mobile Role Visibility Notes

**Audit Date:** 2026-06-16  
**All mobile role checks PASS**

---

## Route Protection

All `/api/mobile/*` routes apply `router.use(protect)` before any handler.  
Each controller independently checks `req.user.role` and returns **403** for wrong roles.

---

## Teacher Mobile (`/api/mobile/teacher/*`)

| Endpoint | Role Required | Cross-Role Test | Result |
|----------|--------------|-----------------|--------|
| `GET /teacher/dashboard` | teacher | Student → 403, Parent → 403 | ✅ |
| `GET /teacher/timetable` | teacher | — | ✅ |
| `GET /teacher/homework` | teacher | Student → 403, Parent → 403 | ✅ |
| `GET /teacher/homework/:hwId/submissions` | teacher (scoped to assigned HW) | — | ✅ |
| `PATCH /teacher/homework/submissions/:id/review` | teacher (scoped) | — | ✅ |
| `GET /teacher/attendance-classes` | teacher | — | ✅ |
| `POST /teacher/attendance-submit` | teacher | — | ✅ |
| `GET /teacher/marks/exams` | teacher | Student → 403, Parent → 403 | ✅ |
| `GET /teacher/marks/exams/:examId/subjects` | teacher (assigned exams) | — | ✅ |
| `POST /teacher/marks/exams/:examId/save` | teacher (assigned subjects) | — | ✅ |

**Teacher sees 3 exams in marks list** — scoped to assigned exam/subject pairs only.

**Screenshot:** `mobile_teacher_scoped_tabs.png`

---

## Student Mobile (`/api/mobile/student/*`)

| Endpoint | Role Required | Cross-Role Test | Result |
|----------|--------------|-----------------|--------|
| `GET /student/dashboard` | student | Teacher → 403, Parent → 403 | ✅ |
| `GET /student/timetable` | student | — | ✅ |
| `GET /student/homework` | student (own class) | — | ✅ |
| `GET /student/exams` | student (own school) | — | ✅ |
| `GET /student/results` | student (own results) | — | ✅ |
| `GET /student/homework/:hwId/submission` | student (own submission) | — | ✅ |
| `POST /student/homework/:hwId/submit` | student | — | ✅ |

**Screenshot:** `mobile_student_own_results.png`

---

## Parent Mobile (`/api/mobile/parent/*`)

| Endpoint | Role Required | IDOR Test | Result |
|----------|--------------|-----------|--------|
| `GET /parent/dashboard` | parent | Student → 403, Teacher → 403 | ✅ |
| `GET /parent/student/:id/timetable` | parent (linked child) | Unlinked → 403 | ✅ |
| `GET /parent/student/:id/homework` | parent (linked child) | Unlinked → 403 | ✅ |
| `GET /parent/student/:id/exams` | parent (linked child) | Unlinked → 403 | ✅ |
| `GET /parent/student/:id/results` | parent (linked child) | Unlinked → 403 | ✅ |

**`getParentLinkedStudentOrThrow()`** helper used across all parent child endpoints — enforces:
1. Role must be `parent`
2. Student must be in `parent.children`
3. Student must have matching `schoolId`

**Screenshot:** `mobile_parent_linked_child_results.png`

---

## No Admin-Only Screens in Mobile

The mobile app has no routes for:
- Admin/super_admin dashboard
- Student management
- Fee collection
- Admission management
- Staff/teacher HR management

These are web-console-only features. The mobile API routes are strictly scoped to teacher/student/parent roles.

---

## Login Role Switching

- Each mobile role endpoint explicitly re-checks `req.user.role` on every request.
- A teacher who logs out and logs in as a parent cannot hit `/mobile/teacher/*` endpoints.
- JWT tokens do not persist role data — role is always fetched live from the database User record.
- No session data leaks observed between role switches.
