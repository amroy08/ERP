# Teacher Role UX Audit

This document reviews the specific user experience (UX) flows and feature access patterns tailored for the Teacher role on the mobile application.

---

## 🔍 Core UX Audits

### 1. Dashboard Actionability
* **Audit**: The current dashboard lists basic stats and horizontal cards for timetable slots, pending attendances, and notice bulletins.
* **Findings**: While functional, it is cluttered and fails to guide teachers toward immediate tasks. The stats panel is static and doesn't highlight daily priorities.
* **UX Opportunity**: Design a "daily actions" widget (e.g. "Mark attendance for Class 10-A", "Grade 3 pending homework submissions") to guide the teacher's workday.

### 2. Attendance Marking Workflow
* **Audit**: Teachers can navigate to the Attendance tab, select a class, and toggle students through states (Present/Absent/Late).
* **Findings**: The toggle pattern is simple but lacks efficiency. Tapping every student multiple times in large classes is tedious. There is also no search or filter function to find a specific student quickly.
* **UX Opportunity**: Implement a "Mark All Present" baseline button, letting teachers toggle only the exceptions (absentees). Add a student search field.

### 3. Homework Review Workflow
* **Audit**: The homework tab lists assignments, opening submissions grids where teachers can tap individual students, view answers, and complete reviews.
* **Findings**: The workflow has too many screens. Reviewing a submission requires navigating deep, reviewing, saving, and returning to list views.
* **UX Opportunity**: Add swipe actions to quick-approve, or support inline grading directly on the roster list for faster evaluation.

### 4. Marks Entry Roster
* **Audit**: Entering marks requires selecting an exam, class, subject, and filling text boxes against student listings.
* **Findings**: Input rows are tight. Entering marks on screen keyboard layouts shifts page heights, causing tap mistakes.
* **UX Opportunity**: Design specialized numeric keypad overlays, showing maximum score indicators directly inside the row header.

### 5. Timetable Accessibility
* **Audit**: Daily periods list on the dashboard.
* **Findings**: It is simple but text-heavy.
* **UX Opportunity**: Add a progress tracker showing the current class period highlighted in real time, with countdowns until the next bell.
