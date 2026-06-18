# Schema Implementation Notes - Phase 4.1A

This document details the database schema additions and relationships established in the Prisma database schema.

## Prisma Migration Details
* **Migration Name**: `20260618135856_add_notification_foundation`
* **Command Executed**: `npx prisma migrate dev --name add_notification_foundation`
* **Target Database**: MySQL (`school_erp`)

---

## Model Layout

### 1. `Notification`
Stores individual alert messages addressed to specific users.
* **Fields**:
  * `id`: UUID (String) primary key.
  * `schoolId`: Links to `School` to allow multi-tenant scoping.
  * `recipientUserId`: Links to `User` receiving the alert.
  * `recipientRole`: Stores `Role` enum to enable quick interface filter mapping.
  * `studentId`: Nullable link to `Student`. Crucial for parents to identify which child the notification is about.
  * `type`: Enum of `NotificationType`.
  * `title`, `message`: String payloads.
  * `relatedEntityType`, `relatedEntityId`: Polymorphic referencing columns (e.g. `"homework"`, `"uuid-string"`).
  * `isRead`, `readAt`: Triggers for status tracking.

### 2. `NotificationDeliveryLog`
Logs the status of a notification across channels (`EMAIL`, `PUSH`, `IN_APP`).
* **Fields**:
  * `id`: UUID (String) primary key.
  * `notificationId`: References `Notification`. Cascade delete enabled.
  * `channel`: Enum `DeliveryChannel`.
  * `status`: Enum `DeliveryStatus`.
  * `sentAt`: Timestamp.
  * `errorMessage`: Raw error dump if dispatch fails.

### 3. `NotificationRule`
Configurable rules mapping school preferences for cooldowns and counts.
* **Fields**:
  * `schoolId`, `type`: Composite unique key mapping.
  * `enabled`: Boolean status enabler.
  * `cooldownHours`: Integer threshold.
  * `thresholdCount`, `thresholdDays`: Window counting columns (for attendance absence checks).
