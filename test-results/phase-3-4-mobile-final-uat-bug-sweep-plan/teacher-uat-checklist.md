# Teacher UAT Checklist — Phase 3.4

### 1. Teacher Dashboard
* **Screen**: `TeacherHomeScreen`
* **Primary flow**: Renders class counts, greetings, schedules, and quick navigation actions.
* **Data/API dependency**: `fetchTeacherDashboard`
* **User action to test**: Log in as Teacher, scroll the screen, tap quick actions ("Mark Attendance", "Add Homework", "View Timetable").
* **Expected result**: Correct info displays on cards. Actions lead to the correct screens.
* **Possible bug/risk**: Class counts or preview items mismatching database values.
* **Priority**: High

### 2. Teacher Attendance Class List
* **Screen**: `TeacherAttendanceScreen` (Class list view)
* **Primary flow**: Lists all classes assigned to the logged-in teacher.
* **Data/API dependency**: `fetchTeacherClasses`
* **User action to test**: Tap the Attendance tab from Home or bottom navigator, review class list.
* **Expected result**: Displays Class 1-A and Student count (28 students).
* **Possible bug/risk**: Empty lists displaying when classes exist.
* **Priority**: High

### 3. Teacher Attendance Marking
* **Screen**: `TeacherAttendanceScreen` (Student roster view)
* **Primary flow**: Marks individual or batch student attendance (Present/Absent/Late).
* **Data/API dependency**: `submitTeacherAttendance`
* **User action to test**: Tap "Mark Now", click "Present"/"Absent"/"Late" on student rows, select "Mark All Present", click "Reset", and click "Submit".
* **Expected result**: Statuses update correctly on UI. Submitting updates values in the database.
* **Possible bug/risk**: UI state updates lag, or submission updates database with incorrect status codes.
* **Priority**: High

### 4. Teacher Timetable
* **Screen**: `TeacherTimetableScreen`
* **Primary flow**: Displays the teacher's scheduled classes per day.
* **Data/API dependency**: `fetchTeacherTimetable`
* **User action to test**: Swipe weekday tab navigation pills (Mon-Fri) and pull-to-refresh.
* **Expected result**: Correct periods, timings, and class sections load for each day.
* **Possible bug/risk**: Weekday pills displaying empty days without correct `EmptyState` templates.
* **Priority**: Medium

### 5. Teacher Homework
* **Screen**: `TeacherHomeworkScreen` (Homework list view)
* **Primary flow**: Lists assignments created by the teacher.
* **Data/API dependency**: `fetchTeacherHomework`
* **User action to test**: View assignment lists, classes, and submission counts.
* **Expected result**: Displays assignments matching class sections.
* **Possible bug/risk**: Homework card showing incorrect submission ratios.
* **Priority**: High

### 6. Teacher Homework Submissions/Review
* **Screen**: `TeacherHomeworkScreen` (Review detail view)
* **Primary flow**: Evaluates submissions, inputs grades, and writes remarks feedback.
* **Data/API dependency**: `reviewHomeworkSubmission`
* **User action to test**: Tap a homework, select a student's submission, review comments, write feedback, submit review.
* **Expected result**: Opens details accurately. Updates status to "reviewed".
* **Possible bug/risk**: Layout overlap when keying in comments.
* **Priority**: High

### 7. Teacher Marks Exam List
* **Screen**: `TeacherMarksScreen` (Exam list view)
* **Primary flow**: Selects active exam schedules.
* **Data/API dependency**: `fetchTeacherExams`
* **User action to test**: Tap the Marks tab, select exam cards.
* **Expected result**: Displays scheduled exams lists accurately.
* **Possible bug/risk**: Active exam schedules missing.
* **Priority**: High

### 8. Teacher Marks Subject List
* **Screen**: `TeacherMarksScreen` (Subject selection view)
* **Primary flow**: Selects class subject for scores entry.
* **Data/API dependency**: `fetchTeacherSubjects`
* **User action to test**: Select an exam card, review classes and subject listings.
* **Expected result**: Subject lists show class targets, grading percentages, and total students.
* **Possible bug/risk**: Grade percentage bars calculating incorrectly.
* **Priority**: High

### 9. Teacher Marks Entry
* **Screen**: `TeacherMarksScreen` (Marks roster entry view)
* **Primary flow**: Inputs scores and updates comments per student.
* **Data/API dependency**: `submitStudentMarks`
* **User action to test**: Click "Enter Marks", enter scores (e.g. 80), verify validation locks on values > 100 or < 0, tap Save/Submit.
* **Expected result**: Valid scores are saved to the database. Out-of-bound inputs are blocked.
* **Possible bug/risk**: Keyboard overlay hides the sticky submit footer buttons.
* **Priority**: High

### 10. Teacher Notices
* **Screen**: `TeacherNoticesScreen`
* **Primary flow**: Circular bulletin circulars page.
* **Data/API dependency**: `fetchTeacherNotices`
* **User action to test**: Review notices lists, click card to expand/collapse full descriptions.
* **Expected result**: Details collapse and expand smoothly without layout shifting.
* **Possible bug/risk**: Notices description clipped.
* **Priority**: Medium
