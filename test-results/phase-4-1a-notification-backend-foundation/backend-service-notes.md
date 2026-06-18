# Backend Service Notes - Phase 4.1A

This document details the software design, method APIs, and query logic added to `NotificationService.ts`.

---

## 1. Core Service Methods

### `createNotification(params)`
* **Design**: Writes the notification record, maps delivery channels, and writes initial delivery log arrays.
* **Safety Integration**: Tries/catches errors internally. If the database save fails, it prints a console warning and returns `null` instead of throwing, ensuring main thread operations (such as notice saves) do not crash.
* **Push Routing**: Safely routes to `PushNotificationService.sendToUser` if the target channels array contains `'PUSH'`.

### `getUserNotifications(params)`
* **Design**: Fetches paginated lists of notification logs for a user, sorted chronologically (`createdAt: 'desc'`).
* **Filters**: Supports filtering by read status (`isRead`) and linked student identifier (`studentId`).

### `getUnreadCount(userId, studentId?)`
* **Design**: Queries count of notifications where `isRead` is false. Filters by `studentId` dynamically if queried.

### `markAsRead(notificationId, userId)`
* **Design**: Validates user ownership of the targeted notification ID before setting `isRead: true` and updating the `readAt` timestamp.

---

## 2. Cooldown Evaluation

### `shouldSendReminder(params)`
* **Function**: Computes time elapsed since the last notification of a given type was generated for a specific recipient, student, and entity target.
* **Algorithm**:
  1. Retrieve rule settings for the current school and event type.
  2. If rule is disabled, return `false`.
  3. If cooldown hours configured $\le$ 0, return `true` (no cooldown active).
  4. Fetch the latest `Notification` where `recipientUserId`, `type`, `studentId`, and `relatedEntityId` match.
  5. If none exists, return `true` (never notified).
  6. If diff in hours $\ge$ `cooldownHours`, return `true` (allowed); else return `false` (block dispatch).
