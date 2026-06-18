# Student UAT Checklist — Phase 3.4

### 1. Student Dashboard
* **Screen**: `StudentHomeScreen`
* **Primary flow**: Greeting, active metrics summary, classes preview, notice highlights.
* **Data/API dependency**: `fetchStudentDashboard`
* **User action to test**: Log in as Student, scroll layout, check metrics boxes.
* **Expected result**: Renders card items displaying attendance rate, pending homework count, and periods count correctly.
* **Possible bug/risk**: Renders incorrect metrics, or notices previews are clipped.
* **Priority**: High

### 2. Student Timetable
* **Screen**: `StudentTimetableScreen`
* **Primary flow**: Weekday class schedules view.
* **Data/API dependency**: `fetchStudentTimetable`
* **User action to test**: Tap navigation pills (Mon-Sat), pull-to-refresh.
* **Expected result**: Class sessions show subject names, periods, hours, room numbers, and teachers.
* **Possible bug/risk**: Weekend/empty days causing crash rather than loading `EmptyState`.
* **Priority**: Medium

### 3. Student Homework
* **Screen**: `StudentHomeworkScreen`
* **Primary flow**: Tracking assignments and launching submissions.
* **Data/API dependency**: `fetchStudentHomework`
* **User action to test**: Tap filter pills (All, Pending, Submitted), click card to expand/collapse details.
* **Expected result**: Card lists filter dynamically and show titles, subjects, due dates, marks, and feedback correctly.
* **Possible bug/risk**: Filter clicks fail to update list items.
* **Priority**: High

### 4. Homework Submission Modal
* **Screen**: `HomeworkSubmissionModal`
* **Primary flow**: Inputting answers, uploading attachments, submitting homework.
* **Data/API dependency**: `submitHomeworkAnswer`
* **User action to test**: Tap "Submit Homework", enter text response, click "Select File", click cancel or submit.
* **Expected result**: Text input works. File uploads display sizes/types. Submit triggers API upload.
* **Possible bug/risk**: Keyboard slides up and covers CTA buttons.
* **Priority**: High

### 5. Student Exams/Results
* **Screen**: `StudentExamsScreen`
* **Primary flow**: Upcoming schedules list and result reports.
* **Data/API dependency**: `fetchStudentExams`, `fetchStudentResults`
* **User action to test**: Toggle segment tab switcher (Schedules / Results), check exam dates and grade bars.
* **Expected result**: Upcoming exams show countdowns (e.g. "3d left"), Results show grades and colored completion progress bars.
* **Possible bug/risk**: Results tab rendering incorrect grade-color mappings.
* **Priority**: High

### 6. Student Notice Preview Behavior
* **Screen**: `StudentHomeScreen` (Notice preview widget)
* **Primary flow**: Highlights recent school notices on student dashboard.
* **Data/API dependency**: `fetchStudentDashboard`
* **User action to test**: Review notices widget card, click to navigate to detail list.
* **Expected result**: Previews match notice priorities and titles.
* **Possible bug/risk**: Preview text runs out of parent card bounds.
* **Priority**: Medium

### 7. Student Attendance Dashboard Summary
* **Screen**: `StudentHomeScreen` (Attendance card widget)
* **Primary flow**: Visualizes summary attendance rate.
* **Data/API dependency**: `fetchStudentDashboard`
* **User action to test**: Review Attendance rate % card widget.
* **Expected result**: Displays overall percentage rate and days present/total (e.g., 67%, 4/6).
* **Possible bug/risk**: Dashboard rate mismatches detailed logs.
* **Priority**: High
