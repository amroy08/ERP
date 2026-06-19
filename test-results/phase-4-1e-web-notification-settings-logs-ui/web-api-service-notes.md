# Phase 4.1E: Web API Service Notes

The client connects to the backend endpoints using a dedicated API client wrapper.

## Service Class
* File: `client/src/services/notificationAdminService.ts`

## Client Wrappers
* `getNotificationRules()`: HITS `GET /notifications/admin/rules`. Returns array of `NotificationRule`.
* `updateNotificationRule(ruleId, payload)`: HITS `PUT /notifications/admin/rules/:id`. Sends enabled status, cooldown hours, thresholds, lookback days.
* `getNotificationLogs(params)`: HITS `GET /notifications/admin/logs`. Fetches paginated logs and accepts filters. Returns logs along with `pagination` metadata.
* `getNotificationLogSummary()`: HITS `GET /notifications/admin/logs/summary`. Returns system counts (total, read, unread, active rules, type breakdowns).
* `runNotificationReminders()`: HITS `POST /notifications/admin/run-reminders`. Triggers immediate manual reminders scan.
