# Implementation Plan - Phase 4.1 Notification System Planning

This document details the architecture, schema, APIs, and trigger integration plan for a comprehensive Notification System in the Vantage School ERP. It spans backend services, DB models, API endpoints, scheduled background jobs, mobile application interfaces, and web admin settings.

## User Review Required

Documenting architectural considerations that require school administrator review:

> [!IMPORTANT]
> **Performance Scaling for Bulk Notices**
> Publishing a school-wide notice can trigger alerts for thousands of students, teachers, and parents. The trigger-based notification calls must run asynchronously (fire-and-forget or queue-backed) so notice creation response times remain fast.

> [!WARNING]
> **Silent Failure and Safety Isolation**
> If the notification creation or push notification delivery fails (e.g., Firebase timeout, mail server issues), the core business operation (submitting attendance, publishing homework, saving marks, processing payments) must not fail. All triggers must catch errors locally and log them safely.

## Open Questions

> [!NOTE]
> **Push Notifications Delivery Channel**
> The mobile app has an existing configuration utilizing Expo Client SDK and Firebase Cloud Messaging (FCM). The `NotificationDeliveryLog` will log if a channel is email, push, or in-app. Does the school want separate push settings per role, or should default global push settings apply? (Proposed: default to global enablement, configurable by role later).

---

## Proposed Changes

### Database & Schema Layer

#### [MODIFY] [schema.prisma](file:///Users/amroy/Desktop/ERP/server/prisma/schema.prisma)
Add models for `Notification`, `NotificationDeliveryLog`, and `NotificationRule`. Map and reuse the existing `DeviceToken` model.

---

### Backend Components

#### [NEW] [notification.service.ts](file:///Users/amroy/Desktop/ERP/server/src/services/notification.service.ts)
A reusable notification orchestrator handling database writes, rule evaluation, bulk sends, and delivery channel routing.

#### [NEW] [notificationController.ts](file:///Users/amroy/Desktop/ERP/server/src/controllers/notificationController.ts)
Controller handling list retrieval, unread counts, marking read, and registering/unregistering device tokens.

#### [NEW] [notificationRoutes.ts](file:///Users/amroy/Desktop/ERP/server/src/routes/notificationRoutes.ts)
HTTP router endpoints for fetching and editing in-app notifications.

#### [MODIFY] [mobileRoutes.ts](file:///Users/amroy/Desktop/ERP/server/src/routes/mobileRoutes.ts)
Add mobile-specific notification query endpoints for teacher, student, and parent roles.

#### [MODIFY] [moduleController.ts](file:///Users/amroy/Desktop/ERP/server/src/controllers/moduleController.ts)
Integrate triggers after notice creation, homework creation, and bulk attendance submissions.

#### [MODIFY] [examController.ts](file:///Users/amroy/Desktop/ERP/server/src/controllers/examController.ts)
Integrate triggers when exams are created/published and marks are saved.

---

### Mobile App (React Native / Expo)

#### [MODIFY] [mobileApi.ts](file:///Users/amroy/Desktop/ERP/mobile/src/api/mobileApi.ts)
Expose API clients for fetching notifications, reading notifications, and querying unread counts.

#### [NEW] [NotificationListScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/shared/NotificationListScreen.tsx)
A shared mobile screen rendering the chronological list of in-app alerts, grouped or filtered by role, featuring pull-to-refresh, empty states, and swipe-to-read actions.

#### [MODIFY] [ParentScreenHeader.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/components/parent/ParentScreenHeader.tsx), [StudentScreenHeader.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/components/student/StudentScreenHeader.tsx), [TeacherScreenHeader.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/components/teacher/TeacherScreenHeader.tsx)
Render a badge-supporting Notification Bell button in the header bar.

---

### Web Console (React / Vite)

#### [NEW] [NotificationRuleSettings.tsx](file:///Users/amroy/Desktop/ERP/client/src/features/settings/NotificationRuleSettings.tsx)
Admin panel page to toggle reminders (e.g., fee overdue reminders, attendance alerts) and set cooldown days / threshold counts.

---

## Verification Plan

### Automated Tests
- Run unit tests to verify trigger logic does not throw when database records are missing.
- Mock Prisma query responses to test cooldown rules (e.g., ensuring a fee reminder doesn't duplicate if run 1 day after the previous alert).

### Manual Verification
1. **Notice Trigger**: Log in as admin, create a notice targeting Super Admins/Teachers/Parents. Verify notification records populate in database.
2. **Attendance Trigger**: Submit student attendance with 3 consecutive absences. Confirm parent user dashboard unread count increments.
3. **Overdue Fee Reminders**: Execute test scheduler job. Verify that student fees overdue by 5 days trigger a reminder only if no previous reminder was sent within the cooldown window.
