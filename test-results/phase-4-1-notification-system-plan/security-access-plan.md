# Security and Access Plan - Phase 4.1

This document specifies the data isolation, role restriction, and protection rules against security exploits like Insecure Direct Object References (IDOR) for the Notification System.

---

## 1. IDOR Prevention & Ownership Integrity

To guarantee that no user can intercept or alter another user's notifications, the backend routes must enforce the following query-level rules:

### A. List Queries (`GET /api/notifications` & `GET /api/notifications/unread-count`)
* The database queries must never rely on a client-submitted `userId` parameter in the body or route parameters.
* The system must resolve the target recipient solely using the authenticated user object attached by the auth middleware:
  ```typescript
  const recipientUserId = req.user.id; // Solved via JWT token payload
  ```

### B. State Updates (`PATCH /api/notifications/:id/read`)
* Before applying changes, the controller must run a verification lookup checking ownership:
  ```typescript
  const notification = await prisma.notification.findUnique({
    where: { id: req.params.id }
  });
  
  if (!notification) {
    return next(createError("Notification not found", 404));
  }
  
  if (notification.recipientUserId !== req.user.id) {
    return next(createError("Forbidden: Ownership verification failed", 403));
  }
  ```

---

## 2. Parent-Child Mapping Scoping

When a user in the `parent` role views notifications or registers child filters:
1. The backend must map the parent User to the corresponding record in the `Parent` table:
   ```typescript
   const parent = await prisma.parent.findUnique({ where: { userId: req.user.id } });
   ```
2. Any request to query student-linked notifications (where `studentId` is provided in the query string) must check that the requested student is in the children array:
   ```typescript
   const isLinked = await prisma.student.findFirst({
     where: { id: targetStudentId, parentId: parent.id }
   });
   
   if (!isLinked) {
     return next(createError("Access Denied: Student is not linked to your account.", 403));
   }
   ```

---

## 3. Student/Parent Fee Isolation

Financial documents and outstanding fees alerts (`FEES_OVERDUE`, `FEES_REMINDER`) represent sensitive parent records:
* By design, the `recipientUserId` for these types matches the parent User ID, not the student User ID.
* Even if a student tries to query notifications matching their own `studentId`, they will only receive notifications where `recipientUserId = studentUser.id`. Because fee reminder notifications are addressed to the parent (`recipientUserId = parentUser.id`), the student user cannot read them.

---

## 4. Admin Log Visibility Control
* Only authenticated users holding `admin` or `super_admin` roles are allowed to access `NotificationDeliveryLog` queries or system audit views.
* Ordinary teachers, students, and parents are blocked from auditing dashboard statistics or accessing log lists.
