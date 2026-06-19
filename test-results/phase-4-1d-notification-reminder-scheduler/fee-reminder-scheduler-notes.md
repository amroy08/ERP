# Fee Reminder Scheduler Notes

## Scanning Rules

- Queries student fee records whose status is `pending`, `partial`, or `overdue`.
- Excludes paid or completed status values (`paid`, `completed`).
- Checks `NotificationRule` configured for `FEES_REMINDER` to evaluate the cooldown window (defaulting to 24 hours).
- If cooldown is active, the record is skipped, incrementing `skippedCooldown`.
- If successful, it invokes `NotificationService.notifyFeeReminderIfAllowed()`, generating the in-app alert and sending an email copy to the parent.
- Students are never notified of fee reminders.
