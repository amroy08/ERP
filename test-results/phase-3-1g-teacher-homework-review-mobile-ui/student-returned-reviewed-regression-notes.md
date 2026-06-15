# Student Returned/Reviewed Regression Notes — Phase 3.1G

## Student Homework Workflows

The student mobile client interacts with homework statuses correctly:

1. **Locking Submissions**:
   - When the teacher marks a submission status as `"reviewed"`, the student homework dashboard prevents further resubmissions. The state is locked.
   - The resubmit buttons on [StudentHomeworkScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentHomeworkScreen.tsx) are disabled and canResubmit evaluates to false.

2. **Returning for Resubmission**:
   - When the teacher returns the submission (setting status to `"returned"`), the lock is released.
   - The student screen reacts instantly, showing a dynamic red indicator badge and enabling the `"Resubmit"` trigger.
   - The student is allowed to overwrite text and upload fresh files.

3. **Feedback/Grade Visibility**:
   - Evaluated grades (marks) and teacher feedback comments are displayed correctly on the student card.
