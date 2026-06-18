# Security & Access Notes

## Tenant Scoping & Isolation
- All query triggers are scoped strictly by the student/recipient's `schoolId`.
- Bulk notifications retrieve and scope users within the parent controller's school context.

## Role Isolation
- Parent notifications are sent exclusively to parents associated with the target student (`parent.userId`).
- Fee reminders and attendance absent alerts are restricted to the parent role only.
- In-app notification fetching (`getUserNotifications` and `getUnreadCount`) isolates results strictly to the requesting user's `userId`.
- Unauthorized requests trying to read or mark other users' notifications as read are rejected (`markAsRead` verifies owner ID, preventing IDOR).
