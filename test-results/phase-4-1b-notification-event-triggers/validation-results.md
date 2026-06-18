# Validation Results

All event triggers were verified successfully using the custom test script:
`server/scripts/test-notification-event-triggers.ts`.

## Checked Triggers & Protections
1. **Homework Trigger**: Creating homework successfully creates notifications for the student and parent.
2. **Notice Scoping Audience**: Notice trigger respects role restriction ('parent' notices only notify parent users).
3. **Exam Scheduled**: Creating/scheduling an exam notifies class students and parent users.
4. **Marks/Result Entry Cooldown**: Saving marks immediately checks rule cooldowns, preventing duplicate notifications during save loops.
5. **Attendance Absence Threshold**: Absences are only sent once the threshold (default: 3 absences in 7 days) is crossed. Cooldown protects from sending consecutive alerts.
6. **Fee Overdue Reminder Cooldown**: Reminder skips paid fees and respects rule cooldowns.
7. **IDOR Scoping**: isolation holds (students cannot view notifications of other users).
