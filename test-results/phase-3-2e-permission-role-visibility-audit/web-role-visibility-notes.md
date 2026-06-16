# Phase 3.2E — Web Console Role Visibility Notes

**Audit Date:** 2026-06-16  
**Test Result:** All web role checks PASS

---

## Super Admin / Admin

| Module | Access | Result |
|--------|--------|--------|
| `/homework` | Full list, all classes/sections | ✅ |
| `/homework/:id/submissions` | All submissions for any homework | ✅ |
| `PATCH /homework/submissions/:id/review` | Can review/return any submission | ✅ |
| `/exams` | Full exam list + create/edit/delete | ✅ |
| `/exams/:id/gradebook` | Gradebook view for any exam | ✅ |
| `/exams/:id/subjects/:sid/marks/save` | Marks entry for any student/subject | ✅ |
| `/exams/results/student/:studentId` | Any student's results | ✅ |
| `/attendance` | Full attendance management | ✅ |
| `/students` | All students in school | ✅ |
| `/teachers`, `/staff`, `/parents` | Full HR access | ✅ |
| `/school` settings | Full settings access | ✅ |

**Screenshot:** `web_admin_homework_submissions_access.png`, `web_admin_gradebook_access.png`

---

## Teacher

| Module | Access | Scoping | Result |
|--------|--------|---------|--------|
| `/homework` | Own assigned + class teacher sections | Filtered by `assignedById`, `classTeacherOf`, `subjectTeachers` | ✅ |
| `/homework/:id/submissions` | Own homework only | 403 for unrelated homework | ✅ |
| `PATCH /homework/submissions/:id/review` | Own homework submissions only | 403 for unrelated | ✅ |
| `/exams` | All exams (view) | Student-scoped auto-filter disabled for teacher | ✅ |
| `/exams/:id/gradebook` | Own assigned subjects only | 403 for unrelated exam | ✅ |
| `/exams/:id/subjects/:sid/marks/save` | Assigned subject only | 403 for unrelated subject | ✅ |
| `/attendance` | Assigned class/section students only | Filtered by `assignedClasses` + `classTeacherOf` | ✅ |
| `/homework/submissions/:id/download` | Own homework files only | 403 for unrelated | ✅ |

**Screenshot:** `web_teacher_scoped_homework.png`, `web_teacher_scoped_marks.png`

---

## Student

| Module | Access | Scoping | Result |
|--------|--------|---------|--------|
| `/homework` | Own class homework only | Filtered by `student.classId` + `sectionId` | ✅ |
| `/homework/:id/submissions` | **BLOCKED** | 403 — submission list is teacher/admin only | ✅ |
| `PATCH /homework/submissions/:id/review` | **BLOCKED** | 403 — review is teacher/admin only | ✅ |
| `/exams` | All school exams (read-only) | No marks entry | ✅ |
| `/exams/:id/gradebook` | **BLOCKED** | 403 — gradebook is staff/teacher/admin only | ✅ |
| `/exams/:id/subjects/:sid/marks/save` | **BLOCKED** | 403 — no EXAM_MARKS_ENTRY | ✅ |
| `/exams/results/student/:id` | Own results only | 403 for another studentId | ✅ |
| `/exams/report/:id` | Own report card only | 403 for another studentId | ✅ |
| `/attendance` | Own records only | Filtered to own `studentId` | ✅ |
| `/homework/submissions/:id/download` | **BLOCKED** | 403 — download via web admin endpoint | ✅ |

**Screenshot:** `web_student_restricted_view.png`

---

## Parent

| Module | Access | Scoping | Result |
|--------|--------|---------|--------|
| `/homework` | Linked child's class homework only | Filtered to `children[].classId` | ✅ |
| `/homework/:id/submissions` | **BLOCKED** | 403 | ✅ |
| `PATCH /homework/submissions/:id/review` | **BLOCKED** | 403 | ✅ |
| `/exams` | All school exams (read) | No EXAM_MARKS_ENTRY | ✅ |
| `/exams/:id/gradebook` | **BLOCKED** | 403 — gradebook blocked for parent | ✅ |
| `/exams/:id/subjects/:sid/marks/save` | **BLOCKED** | 403 — no EXAM_MARKS_ENTRY | ✅ |
| `/exams/results/student/:id` | Linked child only | 403 for unlinked studentId | ✅ |
| `/exams/results/parent/:id` | Linked child only | 403 for unlinked studentId | ✅ |
| `/exams/report/:id` | Linked child only | 403 for unlinked studentId | ✅ |
| `/attendance` | Linked child's records only | Filtered to linked child | ✅ |
| `/homework/submissions/:id/download` | **BLOCKED** | 403 — admin/teacher download endpoint | ✅ |

**Screenshot:** `web_parent_linked_child_results.png`

---

## Staff (Clerk)

Verified structurally from `ROLE_PERMISSIONS` in `constants.ts`:

| Check | Result |
|-------|--------|
| No `exam:marks_entry` | ✅ Cannot enter marks |
| No `homework:create` | ✅ Cannot create homework |
| No `timetable:manage` | ✅ Cannot manage timetables |
| No `settings:update` | ✅ Cannot change school settings |
| Has `exam:view` | ✅ Can view exam list |
| Has `attendance:mark` | ✅ Can mark daily attendance |
| Has `admission:approve` | ✅ Can convert admissions to students |

---

## Key Findings

- No privilege escalation paths found.
- No role can access endpoints beyond its permission set.
- Student/parent cannot use submission review or gradebook endpoints — double-protected at RBAC + controller level.
- Teacher scope is enforced at controller level (not just RBAC) for homework, marks, and submission access.
- All scoped data (student, parent, teacher) returns filtered results — no "empty 200" leaks that could enumerate IDs.
