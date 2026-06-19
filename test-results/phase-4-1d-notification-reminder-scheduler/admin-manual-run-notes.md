# Admin Manual Run Notes

## Endpoint Specification

- **Path**: `POST /api/notifications/admin/run-reminders`
- **Authentication**: Required (`protect` middleware).
- **Access Control**: Restricted to user roles `admin` and `super_admin` (`requireRoles` middleware).
- **Response Shape**:
```json
{
  "success": true,
  "message": "Reminder scans completed successfully.",
  "data": {
    "feeReminderScan": {
      "scanned": 805,
      "eligible": 805,
      "created": 3,
      "skippedPaid": 0,
      "skippedCooldown": 802,
      "skippedNoParent": 0,
      "errors": 0
    },
    "absenceReminderScan": {
      "scanned": 274,
      "thresholdMet": 1,
      "created": 1,
      "skippedCooldown": 0,
      "skippedNoParent": 0,
      "errors": 0
    }
  }
}
```
- **Information Leak Protection**: Only returns counts. No student IDs, names, emails, parent details, or monetary values are returned in the response payload.
