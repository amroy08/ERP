# Backend API Endpoints Plan - Phase 4.1

This document describes the design of REST API endpoints for fetching, reading, and managing user notifications and device tokens.

## Endpoints Summary

All routes require authentication via the `protect` middleware.

### 1. Retrieve In-App Notifications
* **Route**: `GET /api/notifications`
* **Query Params**:
  * `page` (optional, default: 1)
  * `limit` (optional, default: 20)
  * `studentId` (optional - used by parents to filter alerts by child)
  * `isRead` (optional - boolean to filter read/unread status)
* **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-string",
        "title": "New Homework Assigned",
        "message": "Homework 'Math Worksheet' due on 2026-06-25.",
        "type": "HOMEWORK_POSTED",
        "studentId": "student-uuid",
        "relatedEntityType": "homework",
        "relatedEntityId": "homework-uuid",
        "priority": "NORMAL",
        "isRead": false,
        "createdAt": "2026-06-18T12:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
  ```

### 2. Retrieve Unread Notifications Count
* **Route**: `GET /api/notifications/unread-count`
* **Query Params**:
  * `studentId` (optional - filters unread alerts by child)
* **Response**:
  ```json
  {
    "success": true,
    "unreadCount": 5
  }
  ```

### 3. Mark Single Notification as Read
* **Route**: `PATCH /api/notifications/:id/read`
* **Body**: None
* **Response**:
  ```json
  {
    "success": true,
    "message": "Notification marked as read."
  }
  ```

### 4. Mark All Notifications as Read
* **Route**: `PATCH /api/notifications/mark-all-read`
* **Body**:
  * `studentId` (optional - mark only notifications for this child as read)
* **Response**:
  ```json
  {
    "success": true,
    "message": "All notifications marked as read."
  }
  ```

### 5. Register Mobile Device Push Token
* **Route**: `POST /api/notifications/device-token`
* **Body**:
  ```json
  {
    "token": "expo-or-fcm-token-string",
    "deviceType": "android",
    "platform": "android 12",
    "appVersion": "1.0.0"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "message": "Device token registered."
  }
  ```

### 6. Deregister / Unregister Push Token
* **Route**: `DELETE /api/notifications/device-token`
* **Body**:
  ```json
  {
    "token": "expo-or-fcm-token-string"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "message": "Device token unregistered."
  }
  ```

---

## Security and Access Isolation Rules

To prevent information leaks and IDOR (Insecure Direct Object Reference) vulnerabilities, the routes enforce the following authorization layers:

1. **Self-Ownership Isolation**:
   * For `GET /api/notifications`, the SQL where clause is hard-locked to the authenticated user's ID: `where: { recipientUserId: req.user.id }`. Under no circumstances can a user fetch notifications belonging to another `userId`.
   * For `PATCH /api/notifications/:id/read`, the update query must verify owner matching:
     ```typescript
     const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
     if (!notification || notification.recipientUserId !== req.user.id) {
       return next(createError("Access Denied or Not Found", 403));
     }
     ```

2. **Parent-Child Scoping**:
   * If a `parent` role user sends `studentId` in query filters, the API must verify parent-child mapping using the `Student` relation:
     ```typescript
     const linkedStudent = await prisma.student.findFirst({
       where: { id: studentId, parentId: parentRecord.id }
     });
     if (!linkedStudent) {
       return next(createError("Forbidden: Student not linked to your account.", 403));
     }
     ```

3. **Academic Isolation**:
   * Students cannot query parent-targeted fee overdue warnings (`FEES_OVERDUE`, `FEES_REMINDER`), even if they share the same `studentId`, because the `recipientUserId` matches the parent's User record.
