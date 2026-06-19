# Mobile API Integration Notes: Notifications

This document outlines the backend integration routes and payloads used by the mobile application.

## Endpoints Mapped

The client maps directly to the backend routes implemented in Phase 4.1A:

1. **Get Notifications**:
   - **Endpoint**: `GET /api/notifications`
   - **Method**: `getNotifications(params?: { studentId?: string; isRead?: boolean; limit?: number; page?: number })`
   - **Response Structure**:
     ```json
     {
       "success": true,
       "data": [
         {
           "id": "uuid",
           "type": "HOMEWORK_POSTED",
           "title": "New Homework",
           "message": "Complete Chapter 2",
           "priority": "NORMAL",
           "isRead": false,
           "readAt": null,
           "createdAt": "2026-06-18T20:20:00.000Z",
           "studentId": "student-uuid"
         }
       ]
     }
     ```

2. **Get Unread Count**:
   - **Endpoint**: `GET /api/notifications/unread-count`
   - **Method**: `getUnreadCount(params?: { studentId?: string })`
   - **Response Structure**:
     ```json
     {
       "success": true,
       "unreadCount": 5
     }
     ```

3. **Mark Single Notification Read**:
   - **Endpoint**: `PATCH /api/notifications/:id/read`
   - **Method**: `markNotificationRead(id: string)`
   - **Response Structure**:
     ```json
     {
       "success": true,
       "notification": {
         "id": "uuid",
         "isRead": true,
         "readAt": "2026-06-18T20:21:00.000Z"
       }
     }
     ```

4. **Mark All Notifications Read**:
   - **Endpoint**: `PATCH /api/notifications/mark-all-read`
   - **Method**: `markAllNotificationsRead(payload?: { studentId?: string })`
   - **Response Structure**:
     ```json
     {
       "success": true,
       "message": "All notifications marked as read"
     }
     ```

## Safety and Normalization

- Missing fields (e.g. empty or null `title`, `message`, `createdAt`) are defaulted gracefully (e.g. falling back to `'Notification'` and current system date).
- Token management is secured internally via the authenticated `apiClient` using JWT access and refresh headers. Credentials are never printed in debug logs.
