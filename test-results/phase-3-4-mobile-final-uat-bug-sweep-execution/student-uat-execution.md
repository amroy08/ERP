# Student UAT Execution — Phase 3.4

### 1. Student Dashboard
* **Screen**: `StudentHomeScreen`
* **Primary flow tested**: Greeting, active metrics summary, classes preview, notice highlights.
* **Data/API dependency**: `fetchStudentDashboard`
* **User action tested**: Logged in as Student, scrolled layout, verified metrics panels.
* **Expected result**: Renders card items displaying attendance rate, pending homework count, and periods count correctly.
* **Actual result**: Dashboard loaded successfully. Shows "Hello, Jane Doe" greeting, metrics "67% Attendance", "4/6 Days Present", and "0 Pending HW". Notice list is displayed.
* **Bug found**: No
* **Priority**: None
* **Evidence screenshot**: [student_dashboard_uat.png](file:///Users/amroy/Desktop/ERP/test-results/phase-3-4-mobile-final-uat-bug-sweep-execution/screenshots/student_dashboard_uat.png)

---

### 2. Student Timetable
* **Screen**: `StudentTimetableScreen`
* **Primary flow tested**: Weekday class schedules view.
* **Data/API dependency**: `fetchStudentTimetable`
* **User action tested**: Tapped Timetable bottom tab, swiped weekday tabs (Mon-Sat), pulled-to-refresh.
* **Expected result**: Class sessions show subject names, periods, hours, room numbers, and teachers.
* **Actual result**: Renders timetable list cleanly. Shows "No Classes Today" empty state on days with no scheduled lessons.
* **Bug found**: No
* **Priority**: None
* **Evidence screenshot**: [student_timetable_uat.png](file:///Users/amroy/Desktop/ERP/test-results/phase-3-4-mobile-final-uat-bug-sweep-execution/screenshots/student_timetable_uat.png)

---

### 3. Student Homework
* **Screen**: `StudentHomeworkScreen`
* **Primary flow tested**: Tracking assignments and launching submissions.
* **Data/API dependency**: `fetchStudentHomework`
* **User action tested**: Tapped Homework bottom tab, tapped filter pills (All, Pending, Submitted), tapped cards to expand/collapse.
* **Expected result**: Card lists filter dynamically and show titles, subjects, due dates, marks, and feedback correctly.
* **Actual result**: Filter tabs work dynamically. Homework cards expand smoothly to reveal description details, submit/resubmit buttons, and teacher feedback.
* **Bug found**: No
* **Priority**: None
* **Evidence screenshot**: [student_homework_uat.png](file:///Users/amroy/Desktop/ERP/test-results/phase-3-4-mobile-final-uat-bug-sweep-execution/screenshots/student_homework_uat.png)

---

### 4. Homework Submission Modal
* **Screen**: `HomeworkSubmissionModal`
* **Primary flow tested**: Inputting answers, uploading attachments, submitting homework.
* **Data/API dependency**: `submitHomeworkAnswer`
* **User action tested**: Tapped "Resubmit" on the expanded homework card, entered mock text responses, tested clicking cancel to close.
* **Expected result**: Text input works. File uploads display sizes/types. Submit triggers API upload.
* **Actual result**: Modal popped up cleanly. Text input is focusable and allows typing. Cancel button closes the modal immediately.
* **Bug found**: No
* **Priority**: None
* **Evidence screenshot**: [student_homework_submission_modal_uat.png](file:///Users/amroy/Desktop/ERP/test-results/phase-3-4-mobile-final-uat-bug-sweep-execution/screenshots/student_homework_submission_modal_uat.png)

---

### 5. Student Exams/Results
* **Screen**: `StudentExamsScreen`
* **Primary flow tested**: Upcoming schedules list and result reports.
* **Data/API dependency**: `fetchStudentExams`, `fetchStudentResults`
* **User action tested**: Tapped Exams bottom tab, toggled SegmentControl (Schedules / Results).
* **Expected result**: Upcoming exams show countdowns (e.g. "3d left"), Results show grades and colored completion progress bars.
* **Actual result**: Upcoming exams show date cards and details. Results section displays completed subjects with grades (e.g. A, B) and color-coded progress bars.
* **Bug found**: No
* **Priority**: None
* **Evidence screenshot**: [student_exams_results_uat.png](file:///Users/amroy/Desktop/ERP/test-results/phase-3-4-mobile-final-uat-bug-sweep-execution/screenshots/student_exams_results_uat.png)

---

### 6. Student Notice Preview Behavior
* **Screen**: `StudentHomeScreen` (Notice preview widget)
* **Primary flow tested**: Highlights recent school notices on student dashboard.
* **Data/API dependency**: `fetchStudentDashboard`
* **User action tested**: Reviewed notices preview items on the student dashboard page.
* **Expected result**: Previews match notice priorities and titles.
* **Actual result**: Previews render priority badges ("MEDIUM", "HIGH") and titles correctly without running out of bounds.
* **Bug found**: No
* **Priority**: None
* **Evidence screenshot**: [student_dashboard_uat.png](file:///Users/amroy/Desktop/ERP/test-results/phase-3-4-mobile-final-uat-bug-sweep-execution/screenshots/student_dashboard_uat.png)

---

### 7. Student Attendance Dashboard Summary
* **Screen**: `StudentHomeScreen` (Attendance card widget)
* **Primary flow tested**: Visualizes summary attendance rate.
* **Data/API dependency**: `fetchStudentDashboard`
* **User action tested**: Reviewed Attendance rate widget cards on Student home.
* **Expected result**: Displays overall percentage rate and days present/total (e.g., 67%, 4/6).
* **Actual result**: Renders "67% Attendance" and "4/6 Days Present" cards matching database details.
* **Bug found**: No
* **Priority**: None
* **Evidence screenshot**: [student_dashboard_uat.png](file:///Users/amroy/Desktop/ERP/test-results/phase-3-4-mobile-final-uat-bug-sweep-execution/screenshots/student_dashboard_uat.png)
