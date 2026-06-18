# API Endpoint Notes - Phase 4.1A

This document details the route mapping, controller actions, and request/response payloads for the new notification API routes.

---

## Route Mappings in `app.ts`
All routes are prefixed under `/api/notifications` and mapped to `notificationRoutes.ts`.

```typescript
router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationsCount);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/mark-all-read', markAllNotificationsAsRead);
router.post('/device-token', registerDeviceToken);
router.delete('/device-token', removeDeviceToken);
```

---

## Payloads and Response Shapes

### 1. `GET /api/notifications`
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-string",
        "type": "HOMEWORK_POSTED",
        "title": "New Homework Assigned",
        "message": "Homework 'Math assignment' was published.",
        "priority": "NORMAL",
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-06-18T12:00:00.000Z",
        "relatedEntityType": "homework",
        "relatedEntityId": "homework-uuid",
        "studentId": "student-uuid"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1
    }
  }
  ```

### 2. `GET /api/notifications/unread-count`
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "unreadCount": 1
  }
  ```

### 3. `PATCH /api/notifications/:id/read`
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "notification": {
      "id": "uuid-string",
      "isRead": true,
      "readAt": "2026-06-18T13:00:00.000Z"
    }
  }
  ```

### 4. `POST /api/notifications/device-token`
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "message": "Device token registered.",
    "data": {
      "id": "token-record-uuid",
      "deviceType": "android",
      "platform": "Android 12",
      "isActive": true
    }
  }
  ```
