# Phase 4.1F: Backend API UAT

Verification results for mounted notification endpoint structures.

## API Validation Log
1. **GET `/api/notifications`**
   * Role: student / parent / teacher
   * Expected: Returns user's own list of notifications.
   * Actual: Retreived successfully.
   * Status: **PASS**
2. **GET `/api/notifications/unread-count`**
   * Role: student / parent / teacher
   * Expected: Returns count of unread notifications.
   * Actual: Count returned correctly.
   * Status: **PASS**
3. **PATCH `/api/notifications/:id/read`**
   * Role: student / parent / teacher
   * Expected: Marks specific notification as read.
   * Actual: Updated `isRead: true` and `readAt` timestamp.
   * Status: **PASS**
4. **PATCH `/api/notifications/mark-all-read`**
   * Role: student / parent / teacher
   * Expected: Marks all user's notifications as read.
   * Actual: Bulk updated successfully.
   * Status: **PASS**
5. **GET `/api/notifications/admin/rules`**
   * Role: admin / super_admin
   * Expected: Returns rules list (autocreates default configs).
   * Actual: Rules returned successfully. Non-admins blocked (403).
   * Status: **PASS**
6. **PUT `/api/notifications/admin/rules/:id`**
   * Role: admin / super_admin
   * Expected: Updates rule configuration and validates inputs.
   * Actual: Saves parameters correctly. Blocks negative hours/counts.
   * Status: **PASS**
7. **GET `/api/notifications/admin/logs`**
   * Role: admin / super_admin
   * Expected: Paginated and filtered lists for school.
   * Actual: Loaded logs. Cleanly filters out device push tokens or private payment totals.
   * Status: **PASS**
8. **GET `/api/notifications/admin/logs/summary`**
   * Role: admin / super_admin
   * Expected: General system counts.
   * Actual: Safe breakdown aggregates returned successfully.
   * Status: **PASS**
9. **POST `/api/notifications/admin/run-reminders`**
   * Role: admin / super_admin
   * Expected: Immediate scheduler check run.
   * Action: Completed scan run and returned safe result counts.
   * Status: **PASS**
