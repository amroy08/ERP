# Teacher Notification UI Verification Notes

This document provides details of the notification UI verification for the Teacher role.

## User Account Used
- **Email**: `tea.alice.0070276@school.local`
- **Role**: `teacher`
- **Password**: `Teacher@123`

## Verification Checklist

1. **Dashboard Notification Bell**:
   - Integrates correctly with `DashboardHero` in the top right.
   - Shows badge count matching the number of unread teacher-specific announcements/notices in the DB.
   - Respects the violet/purple brand accent.

2. **Notifications List**:
   - Renders with the `TeacherScreenHeader` matching the teacher style guide.
   - Correctly lists all notices and circulars created for the teacher audience.
   - Pull-to-refresh reload is responsive.

3. **Actions**:
   - "Mark All as Read" acts on all unread notifications, updating the list immediately and clearing the bell badge count.
