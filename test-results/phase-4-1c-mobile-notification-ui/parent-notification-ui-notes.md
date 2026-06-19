# Parent Notification UI Verification Notes

This document provides details of the notification UI verification for the Parent role.

## User Account Used
- **Email**: `parent.adm20267881@school.local`
- **Role**: `parent`
- **Password**: `Admin@123`

## Verification Checklist

1. **Dashboard Notification Bell**:
   - Integrates correctly with `DashboardHero` in the top right.
   - Shows badge count matching the number of unread parent-specific notifications (e.g. child absent alert, overdue fee reminder, notices) in the DB.
   - Respects the blue brand accent.

2. **Notifications List**:
   - Renders with the `ParentScreenHeader` matching the parent style guide.
   - Shows child-specific tags or descriptions safely.
   - Pull-to-refresh reload is responsive.

3. **Actions**:
   - Tapping "Mark All as Read" successfully marks all unread notifications for the parent as read, resetting the list unread status and updating the dashboard bell badge.
