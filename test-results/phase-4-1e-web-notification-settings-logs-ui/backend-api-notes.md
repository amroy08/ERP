# Phase 4.1E: Backend API Notes

The notification center backend endpoints are securely exposed and mounted under the `/api/notifications` route router.

## Mounted Routes
1. **GET `/api/notifications/admin/rules`**
   * Controller: `getAdminRules`
   * Action: Retrieves all notification reminder rules for the current admin's school. If rules do not exist, it seeds default values for `FEES_REMINDER` (24h cooldown) and `ATTENDANCE_ABSENCE_ALERT` (24h cooldown, threshold 3, lookback 7 days).
2. **PUT `/api/notifications/admin/rules/:id`**
   * Controller: `updateAdminRule`
   * Action: Updates a rule configuration. Supports editing `enabled`, `cooldownHours`, `thresholdCount`, and `thresholdDays`. Validates that numeric inputs are non-negative.
3. **GET `/api/notifications/admin/logs`**
   * Controller: `getAdminLogs`
   * Action: Retrieves paginated and filtered notification logs for the school. Supports filtering by type, role, read status, and priority. Returns details safely without exposing private user fields.
4. **GET `/api/notifications/admin/logs/summary`**
   * Controller: `getAdminLogsSummary`
   * Action: Returns aggregates (total notifications sent, read vs unread counts, enabled rules, type breakdowns) for dashboard metrics.
5. **POST `/api/notifications/admin/run-reminders`**
   * Controller: `runReminders`
   * Action: Triggers the reminder engine immediately. Returns summary counts of the scanning result without altering student/parent data or fee balances.

## Role Restrictions
* All admin endpoints require `admin` or `super_admin` roles.
* Non-admin roles (e.g. `teacher`, `student`, `parent`) receive a `403 Access Denied` response.
