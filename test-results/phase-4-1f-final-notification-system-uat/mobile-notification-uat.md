# Phase 4.1F: Mobile Notification UAT

Verification details for mobile dashboards, counts, and interactive lists.

## Fresh Corrective Pass Statement
* This was a fresh corrective UAT evidence pass.
* No source files were modified, and all validations were freshly rerun.
* **Findings / Capture Limitation**: Mobile screenshots are preserved from the initial verification run. They could not be freshly captured during this corrective pass because the headless CI/CD runner has no mobile emulators or phone devices connected.

## Role-based Checks

### 1. Teacher Console
* **Bell Icon**: Dashboard header renders the notification bell with live unread badge counts.
* **Notification List**: Opens a dedicated view displaying notification items.
* **Pull-to-Refresh**: Fetches latest alerts from server.
* **Mark Read**: Tapping an item marks it read, updating badge counts.
* **Empty State**: Displays when no notifications exist.
* **Status**: **PASS WITH FINDINGS** (Preserved screenshot check)
* **Evidence**:
  * Dashboard: [teacher_notification_bell_final_uat.png](screenshots/teacher_notification_bell_final_uat.png)
  * List: [teacher_notification_list_final_uat.png](screenshots/teacher_notification_list_final_uat.png)
  * Actions: [teacher_notification_mark_read_final_uat.png](screenshots/teacher_notification_mark_read_final_uat.png)

### 2. Student Console
* **Bell Icon**: Dashboard header displays unread badge counts.
* **Alert Delivery**: Receives only student-relevant notifications (e.g. homework, circulars, exams, marks).
* **Isolation**: Cannot see parent fee reminders or parent-specific attendance alerts.
* **Read Actions**: Supports marking single notifications as read.
* **Status**: **PASS WITH FINDINGS** (Preserved screenshot check)
* **Evidence**:
  * Dashboard: [student_notification_bell_final_uat.png](screenshots/student_notification_bell_final_uat.png)
  * List: [student_notification_list_final_uat.png](screenshots/student_notification_list_final_uat.png)
  * Action: [student_notification_mark_read_final_uat.png](screenshots/student_notification_mark_read_final_uat.png)

### 3. Parent Console
* **Bell Icon**: Header displays unread badge counts.
* **Alert Delivery**: Receives homework/circular/marks alerts for all linked children, parent fee reminders, and parent repeated absence alerts.
* **Read Actions**: Marks single or all notifications as read.
* **Status**: **PASS WITH FINDINGS** (Preserved screenshot check)
* **Evidence**:
  * Dashboard: [parent_notification_bell_final_uat.png](screenshots/parent_notification_bell_final_uat.png)
  * List: [parent_notification_list_final_uat.png](screenshots/parent_notification_list_final_uat.png)
  * Mark All Read: [parent_notification_mark_all_read_final_uat.png](screenshots/parent_notification_mark_all_read_final_uat.png)
