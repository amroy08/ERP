# Student Notification UI Verification Notes

This document provides details of the notification UI verification for the Student role.

## User Account Used
- **Email**: `stu.adm20267881@school.local`
- **Role**: `student`
- **Password**: `Student@123`

## Verification Checklist

1. **Dashboard Notification Bell**:
   - Integrates correctly with `DashboardHero` in the top right.
   - Shows badge count matching the number of unread student-specific notifications (e.g. homework assigned, exam scheduled, result published) in the DB.
   - Respects the green brand accent.

2. **Notifications List**:
   - Renders with the `StudentScreenHeader` matching the student style guide.
   - Shows homework, exam, and marks cards with type-aware icons.
   - Pull-to-refresh reload is responsive.

3. **Actions**:
   - Tapping an unread card (e.g., "New Homework: Mathematics") triggers the `markNotificationRead` callback, removes the unread visual indicator, fades the card, and decrements the bell badge count.
