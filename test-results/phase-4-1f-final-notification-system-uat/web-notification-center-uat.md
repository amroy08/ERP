# Phase 4.1F: Web Notification Center UAT

Verification details for the web console settings, rules, filter logs, and manual run dashboard.

## Web Console Features Verified
1. **Reminder Rules Tab**:
   * Settings loaded correctly. Changed cooldowns for fees reminder to `48 hours` and attendance absence lookback to `10 days`. Saves succeeded and updated the database immediately.
   * **Evidence**: [web_notification_center_rules_final_uat.png](screenshots/web_notification_center_rules_final_uat.png)
2. **Notification Logs Tab**:
   * Logs rendered in data table. Filters by type, recipient role, read status, and priority work and refresh the grid asynchronously.
   * **Evidence**: [web_notification_center_logs_final_uat.png](screenshots/web_notification_center_logs_final_uat.png)
3. **Manual Run Tab**:
   * Scans invoked successfully. Output counts report modal shown correctly.
   * **Evidence Panel**: [web_notification_center_manual_run_final_uat.png](screenshots/web_notification_center_manual_run_final_uat.png)
   * **Evidence Results**: [web_notification_center_manual_result_final_uat.png](screenshots/web_notification_center_manual_result_final_uat.png)

## Parity & Existing Checks
* The settings integrations did not break any existing routes or settings parameters (e.g. school setups, academic years, and module licensing).
* Admin role permissions check restricts access properly.
