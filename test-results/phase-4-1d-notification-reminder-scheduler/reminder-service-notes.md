# Reminder Service Notes

The `NotificationReminderService` serves as the core orchestration layer for background reminder jobs in the School ERP.

## Structure

```typescript
export class NotificationReminderService {
  static async runFeeReminderScan(): Promise<FeeReminderScanSummary>;
  static async runAbsenceReminderScan(): Promise<AbsenceReminderScanSummary>;
  static async runAllReminderScans(): Promise<AllRemindersSummary>;
  static async getReminderRules(schoolId?: string): Promise<NotificationRule[]>;
}
```

## Features

- **Transaction-safe loops**: Individual errors in scanning fees or students do not crash the scan loop.
- **Precision summaries**: Returns only summary counts for security purposes, showing metrics for scanned, eligible, created, skipped, and errors.
- **Direct linkage checks**: Verifies parent existence and active status before initiating notification deliveries.
