# Parent Security Scoping & Isolation Notes (Phase 3.1C)

This document contains security notes detailing parent-child relationship checks and IDOR negative testing logic implemented during Phase 3.1C.

---

## 1. Helper Security Validation: `getParentLinkedStudentOrThrow`
At the beginning of each child academic endpoint, a shared helper checks the following security invariants:
1. **Parent Identity Validation**: Asserts that `req.user.role === 'parent'`.
2. **Parent Profile Existence**: Finds parent row by `userId` using `prisma.parent.findUnique`.
3. **Child Linking Validation**: Checks if requested `studentId` belongs to the array of linked children:
   ```typescript
   children: {
     where: { id: studentId, status: 'active' },
   }
   ```
4. **School Scope Validation**: Asserts that `child.schoolId === authUser.schoolId`, preventing leakage of child data across different schools.

If any invariant fails, the helper throws an error with status code `403 Access Denied`.

---

## 2. IDOR Negative Testing Verification
To guarantee that a parent cannot access an unrelated student's academic data, we ran automated test scripts which logged in as `parent@school.com` and attempted queries for another student ID.

### Test Matrix & Results:
| Request Path | Expected Status | Actual Status | Result |
| --- | --- | --- | --- |
| `/api/mobile/parent/student/UNLINKED_STUDENT_ID/timetable` | `403` | `403` | **BLOCKED** |
| `/api/mobile/parent/student/UNLINKED_STUDENT_ID/homework` | `403` | `403` | **BLOCKED** |
| `/api/mobile/parent/student/UNLINKED_STUDENT_ID/exams` | `403` | `403` | **BLOCKED** |
| `/api/mobile/parent/student/UNLINKED_STUDENT_ID/results` | `403` | `403` | **BLOCKED** |

All tests successfully block access with standard Express error payloads, proving that IDOR protection is fully operational.
