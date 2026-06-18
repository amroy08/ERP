# Security and Access Notes - Phase 4.1A

This document details the security constraints and authorization layers implemented to protect notification resources in the Vantage School ERP.

---

## 1. IDOR Prevention & User Bound Queries

To prevent Insecure Direct Object References (IDOR), the backend controller strictly isolates query limits:
* **Token Ownership Binding**: For `getNotifications`, `getUnreadNotificationsCount`, and `markAllNotificationsAsRead`, the queries bind the parameter to the token user:
  ```typescript
  const userId = req.user.id;
  ```
  No client can specify a different `userId` parameter to inspect or modify another account's settings.
* **Single Record Access Verification**: When marking a single notification read (`PATCH /api/notifications/:id/read`), the service checks that both parameters match:
  ```typescript
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      recipientUserId: userId,
    },
  });
  ```
  If the notification ID exists but belongs to a different recipient, the method returns `null`, causing the controller to respond with a `404 Not Found` (to prevent ID enumeration leaks).

---

## 2. Parent-Child Scoping

Parents can optionally filter notification views using `studentId` query parameters.
To ensure parents only see alerts for their linked children, a verification helper is executed before executing the queries:
```typescript
const parent = await prisma.parent.findUnique({
  where: { userId: parentUserId },
  include: { children: { select: { id: true } } },
});
const isLinked = parent?.children.some(child => child.id === studentId);
```
If `isLinked` returns false, the request is terminated with a `403 Forbidden` error.

---

## 3. Role Isolation & Visibility

* **Student Account Isolation**: Student accounts are prevented from accessing any notification linked to parent accounts (e.g. parent fee alerts).
* **Device Token Scope**: Device token actions (`POST /device-token`, `DELETE /device-token`) are strictly isolated to the authenticated user ID of the current request thread, preventing hijack attempts.
