# Notification System Requirements - Phase 4.1

This document specifies the business logic, target audiences, delivery formats, and spam-prevention rules for notifications in the School ERP.

## Event Types & Targets

The system triggers notifications for six key academic, administrative, and financial events:

| Event Type | Trigger Condition | Primary Recipient(s) | Payload Details | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **HOMEWORK_POSTED** | Teacher creates new homework | Student of class/section; Linked Parent(s) | Title, subject name, due date, description | NORMAL |
| **EXAM_POSTED** | Teacher/Admin schedules/publishes exam | Student of class; Linked Parent(s) | Exam name, start date, end date, class name | NORMAL |
| **MARKS_POSTED** | Teacher saves exam marks for a subject | Individual Student; Linked Parent(s) | Subject, exam name, obtained/max marks, grade | NORMAL |
| **NOTICE_POSTED** | Admin/Teacher creates notice | Filtered by audience: Teacher, Student, Parent, or All | Title, notice content, publish date, priority | HIGH / NORMAL |
| **FEES_OVERDUE** | Student fee structure passes due date without full payment | Parent linked to student | Structure name, amount due, days overdue | HIGH |
| **FEES_REMINDER** | Scheduled job runs and fee remains unpaid | Parent linked to student | Structure name, amount due, payment instructions | NORMAL |
| **ATTENDANCE_ABSENCE_ALERT** | Attendance is submitted & student is marked absent | Linked Parent(s) | Date, student name, total absences in window | HIGH |

---

## Cooldown and Spam Prevention Rules

To protect users (especially parents) from notification fatigue, the system enforces the following business logic:

### 1. Fee Reminders Cooldown
* **First Notification**: Automatically sent when a fee structure crosses its due date (status shifts to overdue).
* **Reminder Schedule**: Additional overdue alerts are controlled by a cooldown interval (default: once every 3 days or 7 days, configurable in school settings).
* **Prevention Query**: Before creating any `FEES_REMINDER` record, the system queries the `Notification` table for the most recent notification of type `FEES_REMINDER` or `FEES_OVERDUE` sent to that user for that specific `studentId` and `relatedEntityId` (the fee structure). If `currentTime - lastSentTime < cooldownPeriod`, the reminder is skipped.
* **Termination Rule**: Reminders stop immediately once `StudentFee.status` becomes `paid` or `refunded`.

### 2. Repeated Absence Alerts
* **Threshold Condition**: The system does not notify parents on every single absence (unless configured as a threshold of 1). Instead, it evaluates historical attendance records over a sliding window:
  * **Window A**: 3 absences within a 7-day period.
  * **Window B**: 5 absences within a 30-day period.
* **Daily Cooldown**: If a parent is notified about a threshold breach, the system starts a cooldown period (default: 48 hours) to prevent the same alert from triggering repeatedly on subsequent consecutive absences.
* **State Verification**: Upon attendance marking, the system fetches absences for the student within the last X days. If threshold count is met, it checks if a notification of type `ATTENDANCE_ABSENCE_ALERT` was created for the same `studentId` within the last Y hours (cooldown period). If yes, the notification is skipped.
