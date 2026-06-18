# Mobile Module Inventory

This inventory documents all navigation screens, bottom tabs, dashboard widgets, and features implemented across the three primary roles in the School ERP mobile application.

---

## 👩‍🏫 1. Teacher Mobile App

### Navigation Tab Bar (Bottom Tabs)
* **Home**: Main shortcut dashboard.
* **Timetable**: Teacher's personal schedule.
* **Attendance**: Daily registration checklist.
* **Homework**: Homework list, submission viewer, and review form.
* **Marks**: Exam listings and student marks entry grid.
* **Notices**: Teacher-targeted circulars list.

### Screens and Widgets
* **Teacher Home Dashboard**:
  * Quick Stats Panel (Total Assigned Classes, Assigned Subjects, Total Students taught).
  * Today's Timetable Widget (vertical period list, auto-filtered).
  * Attendance Compliance Checklist (shortcuts to classes with pending attendance).
  * Recent Notices Widget (bulletins targeted to `teacher` or `all`).
* **Teacher Timetable Screen**:
  * Weekly day-tabs navigation.
  * Period lists with times, subjects, classes, and classroom/section names.
* **Teacher Attendance Screen**:
  * Assigned classes/sections checklist.
  * Bulk status toggle list (toggles student state: `Present` -> `Absent` -> `Late`).
  * Attendance submit post handler (records formatted date as UTC midnight).
* **Teacher Homework Management Screen**:
  * Assignment listing panel.
  * Submissions roster (displays submission counts, student names, and status tags: `pending`, `submitted`, `reviewed`, `returned`).
  * Submission Detail Screen: displays text answers, download link for file attachment.
  * Review Modal: forms to enter numeric marks, text feedback, status picker.
* **Teacher Marks Entry Screen**:
  * Exam selector (queries available exams).
  * Subject selector (based on exam-eligible classes).
  * Student marks entry matrix (input inputs for numeric scores with validations against `maxMarks` check).

---

## 👨‍🎓 2. Student Mobile App

### Navigation Tab Bar (Bottom Tabs)
* **Home**: Main academic dashboard.
* **Timetable**: Weekly class schedule.
* **Homework**: Personal class assignments lists and submit forms.
* **Exams**: Upcoming test schedules and results summary.

### Screens and Widgets
* **Student Home Dashboard**:
  * Quick Academic Summary (Today's classes count, Pending homework count, Active notices count).
  * Attendance Indicator (percentage present).
  * Recent Notices Widget (list showing notice titles and high/normal priority indicators).
* **Student Timetable Screen**:
  * Weekly schedule view showing period numbers, times, subject titles, and teacher names.
* **Student Homework Screen**:
  * Assignment cards displaying title, description, class, subject, deadline status, and review status (e.g. `Reviewed`, `Returned`, `Pending Review`).
  * Upload Form page: handles short answers input and single document attachment uploading (`multipart/form-data`).
* **Student Exams & Results Screen**:
  * Upcoming Exam list with subjects, dates, and times.
  * Results tab: cards displaying scored marks, percentages, and letter grades.

---

## 👥 3. Parent Mobile App

### Navigation Tab Bar (Bottom Tabs)
* **Home**: Child profiles switcher and dashboards.
* **Attendance**: Calendar-style attendance visualizer.
* **Academics**: Unified schedule, homework logs, and results.
* **Fees**: Outstanding billing ledger.
* **Notices**: General announcements board.

### Screens and Widgets
* **Parent Home Dashboard**:
  * Sibling profile card switcher (toggles child data scope).
  * Selected child quick profile summary (admission number, roll number, section).
  * Daily compliance indicators (homework status, dashboard indicators).
* **Parent Attendance Screen**:
  * Monthly list of student presence/absence flags.
  * Compliance stats widget (Present, Absent, Late counters, percentage compliance indicator).
* **Parent Academics Screen**:
  * Timetable Tab: child's daily period planner.
  * Homework Tab: child's assignments list, grades, feedback.
  * Exams Tab: upcoming exam lists.
  * Results Tab: marks cards, percentage averages, teacher remarks.
* **Parent Fees Screen**:
  * Student fees list showing fee structure names, total billing, amounts paid, amounts due, and payment status badges (`paid`, `partial`, `unpaid`).
* **Parent Notices Screen**:
  * List of bulletins targeted to `parent` or `all` with tap-to-expand details.
