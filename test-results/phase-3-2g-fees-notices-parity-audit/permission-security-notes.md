# Phase 3.2G Permission & Security Notes

## Endpoint Security & Token Validation
All endpoints (Web and Mobile) are secured with Express middleware:
- **Authentication**: JWT token validation via `protect` middleware. An authorization header (`Authorization: Bearer <JWT_TOKEN>`) must be present and valid.
- **RBAC Authorization**: The `authorize(permission)` middleware checks if the user's role (extracted from the JWT) has the required permission defined in `ROLE_PERMISSIONS` (configured in `server/src/config/constants.ts`).

---

## Role Visibility Boundaries (RBAC)

### 1. Web Console Protection
- **Fees**: Creating fee structures (`FEE_CREATE`), collecting fees (`FEE_COLLECT`), and generating reports require specific administrative permissions. Parents, Students, and Teachers attempting to call POST `/api/fees/collect` are blocked with a `403 Forbidden` status.
- **Notices**: Publishing or editing notices (`NOTICE_CREATE`, `NOTICE_UPDATE`) is restricted to Admin, Principal, and Clerk roles. Teachers, Parents, and Students attempting to POST to `/api/notices` are blocked with a `403 Forbidden` status.

### 2. Mobile App Protection
- **Fees Tab Access**: Only the `parent` role is permitted to call GET `/api/mobile/parent/fees`. Requests from `teacher` and `student` roles return a `403 Forbidden` status.
- **Notices Tab Access**: Only the `parent` role is permitted to call GET `/api/mobile/parent/notices`. Requests from `teacher` and `student` roles return a `403 Forbidden` status.

---

## Indirect Object Reference (IDOR) Protection
- **Parent Student Profile Boundary**: The endpoint `/api/mobile/parent/student-profile/:studentId` validates that the requested student ID is linked to the authenticated parent user:
  ```typescript
  const parent = await prisma.parent.findUnique({
    where: { userId: authUser.id },
    include: { children: { select: { id: true } } },
  });

  if (!parent || !parent.children.some(child => child.id === studentId)) {
    return next(createError('Access denied. This student is not linked to your account.', 403));
  }
  ```
- **Auditing Result**: Parent attempting to access profile details of an unlinked student (IDOR attack) is blocked immediately with a `403 Forbidden` response.

## Security Audit Verification Results
Our automated test script (`test-fees-notices-parity-audit.ts`) confirmed 100% boundary isolation across all tested vectors:
- **RBAC Validation**: 100% of unauthorized endpoint access attempts blocked with `403`.
- **IDOR Isolation**: Linked profile accessed successfully; unlinked profile accesses rejected with `403`.
