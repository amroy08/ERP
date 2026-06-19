# Phase 4.1F: Reminder Scheduler UAT

Verification details for Fee Reminders and Repeated Absence checks.

## Manual Trigger & Cooldown Verification
We executed the manual scan check via:
`POST /api/notifications/admin/run-reminders`

### Scan Metrics Output
1. **Fee Reminder Scan**:
   * Scanned: 805 records/invoices
   * Eligible: 805 parents
   * Created: 3 notifications
   * Skipped (Cooldown): 802 parents (cooldown limit active)
   * Errors: 0
2. **Absence Reminder Scan**:
   * Scanned: 274 active students
   * Threshold Crossed: 1 student (crosses limit of 3 absences within lookback window)
   * Created: 1 notification
   * Skipped (Cooldown): 0
   * Errors: 0

### Functional Checklists
* **Paid/Completed Fee Skip**: Verified that student fee structures marked `paid` or `completed` are automatically skipped and generate 0 reminder alerts.
* **Parent-Only Targeting**: Reminders are sent only to the parent user associated with the student. No student user profiles receive fee reminder messages.
* **Absence Alert Targeting**: Repeated absence checks match student attendance records, target parent users, and respect the lookback window.
