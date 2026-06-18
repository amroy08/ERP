# Event Trigger Plan - Phase 4.1

This document outlines the trigger hooks to integrate the Notification System into existing administrative and academic modules.

---

## 1. Homework Trigger
* **Hook Point**: `server/src/controllers/moduleController.ts` inside `createHomework`.
* **Action**: After successfully creating the `Homework` record:
  1. Retrieve all active students belonging to the specified `classId` and optional `sectionId`.
  2. For each student, find their `userId` and their parent's `parentId` and subsequent parent `userId`.
  3. Invoke `notificationService.createBulkNotifications()` with:
     * **Type**: `HOMEWORK_POSTED`
     * **Title**: `New Homework: ${homework.title}`
     * **Message**: `A new homework has been assigned for ${subjectName}. Due: ${dueDate}`
     * **Recipient List**: Map of both student and parent user IDs.

---

## 2. Exam Trigger
* **Hook Point**: `server/src/controllers/examController.ts` inside `createExam` / `publishExam`.
* **Action**: After successfully scheduling or publishing the `Exam`:
  1. Retrieve all active students in the specified `classId`.
  2. Fetch linked parent user accounts.
  3. Invoke `notificationService.createBulkNotifications()` with:
     * **Type**: `EXAM_POSTED`
     * **Title**: `Exam Scheduled: ${exam.name}`
     * **Message**: `Exam "${exam.name}" (${exam.type}) has been scheduled from ${exam.startDate} to ${exam.endDate}.`
     * **Recipient List**: Combined student and parent user IDs.

---

## 3. Marks/Result Trigger
* **Hook Point**: `server/src/controllers/examController.ts` inside `submitMarks` / `saveStudentMark` or bulk upload.
* **Action**: When marks are published:
  1. Loop through each student's results.
  2. Retrieve student `userId` and linked parent `userId`.
  3. Invoke `notificationService.createNotification()` for each student-parent pair:
     * **Type**: `MARKS_POSTED`
     * **Title**: `Marks Published: ${subjectName}`
     * **Message**: `Result for ${studentName} in ${subjectName} is published: ${marksObtained}/${maxMarks} (${grade})`
     * **Recipient Roles**: Distinct messages for student and parent.

---

## 4. Notice Trigger
* **Hook Point**: `server/src/controllers/moduleController.ts` inside `createNotice`.
* **Action**: After creating the `Notice` record:
  1. Retrieve users in the school based on target audience:
     * `targetRoles` contains `'student'` $\rightarrow$ Find active student users.
     * `targetRoles` contains `'parent'` $\rightarrow$ Find active parent users.
     * `targetRoles` contains `'teacher'` $\rightarrow$ Find active teacher users.
     * `targetRoles` contains `'all'` or empty $\rightarrow$ All active users in the school.
  2. Send bulk notifications:
     * **Type**: `NOTICE_POSTED`
     * **Title**: `Notice: ${notice.title}`
     * **Message**: Notice content snippet.

---

## 5. Fee Trigger (Due Date / Overdue Status)
* **Hook Point**: Scheduled daily cron task.
* **Action**:
  1. Find student fees (`StudentFee` records) that are unpaid/partially paid and have a due date in the past.
  2. Retrieve the linked parent `userId`.
  3. For each overdue fee, evaluate the **cooldown rule**:
     * Query `Notification` table for any `FEES_OVERDUE` or `FEES_REMINDER` sent to the parent for this student and fee structure within the cooldown threshold (e.g. 7 days).
     * If no alert was sent in that window, invoke `notificationService.createNotification()` with `FEES_OVERDUE`.

---

## 6. Attendance Trigger (Absence Threshold)
* **Hook Point**: `server/src/controllers/moduleController.ts` inside `markAttendance`.
* **Action**: When student attendance is submitted and marked `absent`:
  1. Check threshold settings for the school (e.g. 3 absences in 7 days).
  2. Run a database query to count occurrences of `absent` status for the student in the historical window.
  3. If threshold is met or crossed:
     * Check if an `ATTENDANCE_ABSENCE_ALERT` notification was created for this student and parent within the daily cooldown period (e.g. 48 hours).
     * If not sent within the cooldown window, trigger a notification to the parent `userId`:
       * **Type**: `ATTENDANCE_ABSENCE_ALERT`
       * **Title**: `Attendance Alert: Repeated Absences`
       * **Message**: `${studentName} has been marked absent ${absentCount} times in the last ${daysWindow} days.`
