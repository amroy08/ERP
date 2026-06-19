# Phase 4.1F: Event Trigger UAT

Verification details for automated notifications created upon database events.

## Fresh Corrective Pass Statement
* This was a fresh corrective UAT evidence pass.
* No source files were modified, and all validations were freshly rerun.

## Trigger Matrix
1. **Homework Posted**
   * Action performed: Teacher creates a homework task.
   * Target recipient: Students of the class and their parents.
   * Expected Notification Type: `HOMEWORK_ASSIGNED`
   * Actual Notification: Created and saved successfully in database.
   * Mobile visible: Yes
   * Web logs visible: Yes
   * Status: **PASS**
2. **Circular Notice Posted**
   * Action performed: Admin publishes a general notice circular.
   * Target recipient: Chosen audience lists (e.g. parents, teachers).
   * Expected Notification Type: `NOTICE_PUBLISHED`
   * Actual Notification: Created and dispatched.
   * Mobile visible: Yes
   * Web logs visible: Yes
   * Status: **PASS**
3. **Exam Created / Published**
   * Action performed: Exam schedule published for a class.
   * Target recipient: Class students and parent profiles.
   * Expected Notification Type: `EXAM_SCHEDULED`
   * Actual Notification: Dispatched to target users.
   * Mobile visible: Yes
   * Web logs visible: Yes
   * Status: **PASS**
4. **Marks / Results Posted**
   * Action performed: Marks entered and locked for a subject.
   * Target recipient: Parents and students.
   * Expected Notification Type: `MARKS_PUBLISHED`
   * Actual Notification: Created and sent.
   * Mobile visible: Yes
   * Web logs visible: Yes
   * Status: **PASS**
5. **Absence Threshold Crossed**
   * Action performed: Manual or automatic scanner counts absences crossing config limit.
   * Target recipient: Linked parent profiles.
   * Expected Notification Type: `ATTENDANCE_ABSENCE_ALERT`
   * Actual Notification: Dispatched on scan match.
   * Mobile visible: Yes
   * Web logs visible: Yes
   * Status: **PASS**
