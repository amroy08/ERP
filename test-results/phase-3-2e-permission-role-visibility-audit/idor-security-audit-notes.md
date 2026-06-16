# Phase 3.2E — IDOR Security Audit Notes

**Audit Date:** 2026-06-16  
**All IDOR checks PASS**

---

## What is IDOR?

Insecure Direct Object Reference (IDOR) — a vulnerability where an authenticated user can access  
another user's resource by manipulating a URL parameter (e.g., changing `:studentId` in a URL).

---

## Student IDOR Tests

| Test | Endpoint | Attacker Role | Target | Expected | Result |
|------|----------|--------------|--------|----------|--------|
| Student own results | `GET /exams/results/student/:ownId` | student | Own ID | 200 | ✅ |
| Student other results | `GET /exams/results/student/:otherId` | student | Different studentId | 403 | ✅ |
| Student own report card | `GET /exams/report/:ownId` | student | Own ID | 200 | ✅ |
| Student other report card | `GET /exams/report/:otherId` | student | Different studentId | 403 | ✅ |
| Student gradebook | `GET /exams/:id/gradebook` | student | Any examId | 403 | ✅ |
| Student marks entry | `POST /exams/:id/.../marks/save` | student | Any | 403 | ✅ |
| Student submission list | `GET /homework/:id/submissions` | student | Any homeworkId | 403 | ✅ |
| Student submission review | `PATCH /homework/submissions/:id/review` | student | Any submissionId | 403 | ✅ |
| Student file download | `GET /homework/submissions/:id/download` | student | Any submissionId | 403 | ✅ |

### Implementation (examController.ts):
```typescript
if (authUser.role === 'student') {
  const student = await prisma.student.findFirst({ where: { userId: authUser.id, ...sidWhere(schoolId) } });
  if (!student || student.id !== studentId) return next(createError('Access denied.', 403));
}
```

---

## Parent IDOR Tests

| Test | Endpoint | Attacker Role | Target | Expected | Result |
|------|----------|--------------|--------|----------|--------|
| Parent linked child exams | `GET /mobile/parent/student/:linkedId/exams` | parent | Linked child | 200 | ✅ |
| Parent linked child homework | `GET /mobile/parent/student/:linkedId/homework` | parent | Linked child | 200 | ✅ |
| Parent linked child results | `GET /mobile/parent/student/:linkedId/results` | parent | Linked child | 200 | ✅ |
| Parent unlinked child exams | `GET /mobile/parent/student/:unlinkedId/exams` | parent | Unlinked student | 403 | ✅ |
| Parent unlinked child homework | `GET /mobile/parent/student/:unlinkedId/homework` | parent | Unlinked student | 403 | ✅ |
| Parent unlinked child results | `GET /mobile/parent/student/:unlinkedId/results` | parent | Unlinked student | 403 | ✅ |
| Parent linked child results (web) | `GET /exams/results/student/:linkedId` | parent | Linked child | 200 | ✅ |
| Parent unlinked child results (web) | `GET /exams/results/student/:unlinkedId` | parent | Unlinked student | 403 | ✅ |
| Student using parent endpoint | `GET /exams/results/parent/:id` | student | Any studentId | 403 | ✅ |
| Parent submission review | `PATCH /homework/submissions/:id/review` | parent | Any submissionId | 403 | ✅ |
| Parent submission download | `GET /homework/submissions/:id/download` | parent | Any submissionId | 403 | ✅ |

### Implementation (mobileController.ts):
```typescript
const getParentLinkedStudentOrThrow = async (authUser, studentId) => {
  if (authUser.role !== 'parent') throw createError('Access denied. Role "parent" required.', 403);
  const parent = await prisma.parent.findFirst({
    where: { userId: authUser.id },
    include: { children: { where: { id: studentId, status: 'active' } } }
  });
  if (!parent || parent.children.length === 0)
    throw createError('Access denied. This student is not linked to your account.', 403);
  if (child.schoolId && authUser.schoolId && child.schoolId !== authUser.schoolId)
    throw createError('Access denied. School mismatch.', 403);
};
```

---

## Cross-Role Mobile IDOR Tests

| Test | Endpoint | Attacker Role | Expected | Result |
|------|----------|--------------|----------|--------|
| Teacher → student dashboard | `GET /mobile/student/dashboard` | teacher | 403 | ✅ |
| Teacher → student homework | `GET /mobile/student/homework` | teacher | 403 | ✅ |
| Teacher → parent dashboard | `GET /mobile/parent/dashboard` | teacher | 403 | ✅ |
| Parent → student dashboard | `GET /mobile/student/dashboard` | parent | 403 | ✅ |
| Parent → teacher dashboard | `GET /mobile/teacher/dashboard` | parent | 403 | ✅ |
| Parent → teacher marks | `GET /mobile/teacher/marks/exams` | parent | 403 | ✅ |
| Student → teacher dashboard | `GET /mobile/teacher/dashboard` | student | 403 | ✅ |
| Student → teacher homework | `GET /mobile/teacher/homework` | student | 403 | ✅ |
| Student → teacher marks | `GET /mobile/teacher/marks/exams` | student | 403 | ✅ |
| Student → parent dashboard | `GET /mobile/parent/dashboard` | student | 403 | ✅ |

---

## Unauthenticated Access Tests

All 7 major endpoints return **401** without a valid JWT:
- `GET /exams` → 401 ✅
- `GET /homework` → 401 ✅
- `GET /attendance` → 401 ✅
- `GET /students` → 401 ✅
- `GET /mobile/student/dashboard` → 401 ✅
- `GET /mobile/teacher/dashboard` → 401 ✅
- `GET /mobile/parent/dashboard` → 401 ✅

---

## Overall IDOR Verdict: **SECURE**

No IDOR vulnerabilities found. Every sensitive resource lookup cross-references the authenticated user's identity against the requested resource's ownership before returning data.
