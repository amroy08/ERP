# Phase 4.1E: Notification Logs UI Notes

The **Notification Logs** tab provides real-time auditability of system alerts.

## Features
1. **Aggregates Summary Widgets**:
   * Renders total sent, read count, unread count, and count of active rules in a grid above the list.
2. **Logs Filtering**:
   * Interactive dropdown selectors allow filtering logs by type (Fees, Attendance, General), recipient role, read status, and priority.
3. **Data Grid & Pagination**:
   * Uses standard `DataTable` with columns showing Type, Recipient Details (role, safe user identifier), Title/Message preview, Status/State, and Sent Date.
   * Renders child delivery log status badges (e.g. `SMS: SENT`, `EMAIL: SENT`).
4. **Data Privacy Safety**:
   * Raw user fields (student names, phone numbers, exact fee balances, device push tokens) are intentionally excluded from the data structures, complying with UAT data guidelines.
