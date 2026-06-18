# Risk and Validation Plan - Phase 4.1

This document identifies potential risks associated with the Notification System implementation and provides mitigation strategies, along with a detailed validation checklist.

---

## 1. Risk Analysis & Mitigation Strategies

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Notification Fatigue / Spam** | High | Medium | Enforce strict database-level cooldown rules for fee reminders and consecutive absence alerts. |
| **Performance Bottleneck on Notice Dispatch** | High | Low | Run dispatches in a non-blocking asynchronous callback or queue task runner. Paginate batch size during database reads. |
| **Transactional Collateral Damage** | Critical | Medium | Wrap the notification triggering code in try/catch blocks. Ensure notification failure never rolls back the parent homework or exam record creation. |
| **Dead Token Accumulation** | Medium | High | Catch FCM token errors (e.g., Unregistered Device). Mark `isActive = false` dynamically in `DeviceToken` on failure. |
| **Duplicate dispatches** | Medium | Medium | Implement unique constraint/index checks in DB rules and enforce lock keys for scheduled cron job threads. |

---

## 2. Validation Plan

To confirm system correctness during Phase 4.2 execution, the following verification actions will be performed:

### A. Database Verification
- Execute database query checks to verify `Notification` and `NotificationDeliveryLog` records are correctly created with correct foreign keys.
- Confirm schema migrations match target Prisma models.

### B. Trigger Validation Checklist
* **T1: Homework Post**: Verify students and linked parents get in-app notifications.
* **T2: Exam Schedule**: Confirm notification dispatches to the correct class list.
* **T3: Result Entry**: Confirm distinct mark alert messages go to student and parent separately.
* **T4: Notice Publish**: Confirm broadcast filtering routes alerts only to matching roles.

### C. Cooldown Logic Validation
* **C1: Overdue Fee**: Trigger fee scan job twice. Verify first execution generates reminders; second execution skips because cooldown is active.
* **C2: Attendance Absence**: Mark a student absent for 3 consecutive days. Check that parent receives alert on day 3, and verify no new alerts trigger on day 4 (cooldown active).
