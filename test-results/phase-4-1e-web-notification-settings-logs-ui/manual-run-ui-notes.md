# Phase 4.1E: Manual Run UI Notes

The **Manual Trigger** tab lets school administrators manually invoke the reminder scheduler engine.

## Features
1. **Interactive Trigger**:
   * A primary execution button "Execute Reminder Scan Now" with an activity status indicator.
2. **Scan Report Modal**:
   * Populates a modal window displaying results parsed by scan type.
   * Reports detailed counts: scanned invoices/students, eligible matches, notification records created, skipped cooldowns, skipped due to missing parent data, and errors.
3. **Safety Protocols**:
   * Executing the manual runner executes only database check passes and creates corresponding notification records.
   * Does not modify student details, parent details, invoice items, or invoice payment balances.
