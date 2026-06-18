# Fee Reminder Trigger Notes

## Triggers
- Triggered by calling the backend helper service method:
  `NotificationService.notifyFeeReminderIfAllowed(studentFeeId)`

## Recipients
- Target: Parent linked to the student. Students do not receive fee reminders.

## Cooldown and Status Check
- Skips immediately if the target `StudentFee` status is already `paid`.
- Checks cooldown using `shouldSendReminder` for `FEES_REMINDER` on the specific `StudentFee` record ID.

## Scheduler Integration
- Since fee reminders are scheduled processes, the full scheduler execution is deferred to Phase 4.1C. The service backend trigger is fully implemented and tested.
