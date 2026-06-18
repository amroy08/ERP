# Notification Schema Plan - Phase 4.1

This document specifies the database models to be added to `server/prisma/schema.prisma` for managing notification delivery state, logs, settings, and device tokens.

## Proposed Prisma Models

```prisma
// ── In-App & Push Notification Record ─────────────────────────────────────
// Represents an individual alert sent to a user.
model Notification {
  id                 String           @id @default(uuid())
  schoolId           String
  recipientUserId    String
  recipientRole      Role             // super_admin, admin, teacher, clerk, parent, student
  studentId          String?          // Associated student (useful for Parent role notifications)
  type               NotificationType
  title              String
  message            String           @db.Text
  relatedEntityType  String?          // e.g., "homework", "exam", "notice", "fee", "attendance"
  relatedEntityId    String?          // UUID reference to the entity
  priority           NotificationPriority @default(NORMAL)
  isRead             Boolean          @default(false)
  readAt             DateTime?
  createdAt          DateTime         @default(now())
  expiresAt          DateTime?

  // Relations
  school             School           @relation(fields: [schoolId], references: [id])
  recipientUser      User             @relation(fields: [recipientUserId], references: [id], onDelete: Cascade)
  student            Student?         @relation(fields: [studentId], references: [id], onDelete: SetNull)
  deliveryLogs       NotificationDeliveryLog[]

  @@index([schoolId])
  @@index([recipientUserId])
  @@index([studentId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

// ── Notification Delivery Log ───────────────────────────────────────────
// Tracks the dispatch status across multiple channels (Email, Push, In-App).
model NotificationDeliveryLog {
  id             String           @id @default(uuid())
  notificationId String
  channel        DeliveryChannel  // EMAIL, PUSH, IN_APP
  status         DeliveryStatus   // PENDING, SENT, FAILED, SKIPPED
  sentAt         DateTime         @default(now())
  errorMessage   String?          @db.Text

  // Relations
  notification   Notification     @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  @@index([notificationId])
  @@index([status])
  @@map("notification_delivery_logs")
}

// ── Notification Rule Settings ─────────────────────────────────────────
// Controls cooldown hours, threshold parameters, and toggle states per school.
model NotificationRule {
  id             String           @id @default(uuid())
  schoolId       String
  type           NotificationType // HOMEWORK_POSTED, EXAM_POSTED, MARKS_POSTED, NOTICE_POSTED, FEES_OVERDUE, FEES_REMINDER, ATTENDANCE_ABSENCE_ALERT
  enabled        Boolean          @default(true)
  cooldownHours  Int              @default(0)     // Hours between successive reminders of this type
  thresholdCount Int?             // e.g., 3 absences
  thresholdDays  Int?             // e.g., within 7 days
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@unique([schoolId, type])
  @@map("notification_rules")
}

// ── Enums ──────────────────────────────────────────────────────────────────

enum NotificationType {
  HOMEWORK_POSTED
  EXAM_POSTED
  MARKS_POSTED
  NOTICE_POSTED
  FEES_OVERDUE
  FEES_REMINDER
  ATTENDANCE_ABSENCE_ALERT
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum DeliveryChannel {
  EMAIL
  PUSH
  IN_APP
}

enum DeliveryStatus {
  PENDING
  SENT
  FAILED
  SKIPPED
}
```

---

## Device Token Model Reuse

The Vantage School ERP database already contains a `device_tokens` table mapped to the `DeviceToken` model:
```prisma
model DeviceToken {
  id         String   @id @default(uuid())
  userId     String
  token      String   @unique
  deviceType String
  platform   String?
  appVersion String?
  isActive   Boolean  @default(true)
  lastSeenAt DateTime @default(now())
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ...
}
```

### Recommendation
* **No modification is required** to the `DeviceToken` structure itself, as it fully aligns with FCM token registration.
* We will establish a relation in the `User` model to link back to the new `Notification` model:
  ```prisma
  model User {
    ...
    notifications Notification[]
  }
  ```
* Ensure appropriate Prisma relation constraints are established in `Student` and `School` models during implementation.
