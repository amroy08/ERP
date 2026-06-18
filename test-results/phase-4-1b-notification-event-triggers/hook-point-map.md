# Notification Hook Points Map

The following controller actions trigger system notifications:

1. **Homework Creation**
   - **File**: `server/src/controllers/moduleController.ts`
   - **Function**: `createHomework`
   - **Trigger**: `NotificationService.notifyHomeworkAssigned(homework)`

2. **Notice/Circular Creation**
   - **File**: `server/src/controllers/moduleController.ts`
   - **Function**: `createNotice`
   - **Trigger**: `NotificationService.notifyNoticePublished(notice)`

3. **Exam Scheduled & Updated**
   - **File**: `server/src/controllers/examController.ts`
   - **Functions**: `createExam` & `updateExam`
   - **Triggers**: `NotificationService.notifyExamScheduled(exam)` & `NotificationService.notifyExamDateChanged(exam, updated)`

4. **Result / Marks Entered & Saved**
   - **File**: `server/src/controllers/examController.ts`
   - **Functions**: `submitMarks` & `saveStudentMark`
   - **Trigger**: `NotificationService.notifyResultPublished`

5. **Attendance Submitted**
   - **Files**: `server/src/controllers/moduleController.ts` & `server/src/controllers/mobileController.ts`
   - **Functions**: `markAttendance` & `submitTeacherAttendance`
   - **Trigger**: `NotificationService.notifyAttendanceAbsent(absentRecords)`

6. **Fee Reminders**
   - **Execution**: Deferred to Phase 4.1C Scheduler. Service method `notifyFeeReminderIfAllowed` is ready for integration.
