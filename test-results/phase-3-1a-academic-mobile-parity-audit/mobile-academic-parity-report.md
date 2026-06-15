# Mobile Academic Parity and Interface Gap Report

This document reports on the API endpoints, data flow, and visual gaps between the School ERP Web Console and the Mobile App.

---

## 1. Mobile Endpoint Audit

The mobile app reads its data through specialized endpoints exposed in `mobileController.ts` ([mobileController.ts](file:///Users/amroy/Desktop/ERP/server/src/controllers/mobileController.ts)). 

### 1.1 Existing Endpoint Status & Payload Structure
* **Parent Dashboard**: `GET /api/mobile/parent/dashboard`
  - Fetches children details (attendance summary, pending fees, upcoming exams, notices).
* **Parent Student Profile**: `GET /api/mobile/parent/student-profile/:studentId`
  - Fetches complete child data including homework, timetable, exams, and report cards.
* **Student Dashboard**: `GET /api/mobile/student/dashboard`
  - Fetches today's timetable, pending homework, notices, and upcoming exams.
* **Student Homework**: `GET /api/mobile/student/homework`
  - Fetches homework assignments mapped to the student's class and section.
* **Student Timetable**: `GET /api/mobile/student/timetable`
  - Fetches active timetable entries for the student's class and section.
* **Student Exams**: `GET /api/mobile/student/exams`
  - Fetches scheduled exams for the student's class.
* **Student Results**: `GET /api/mobile/student/results`
  - Fetches published marks/report cards for the logged-in student.
* **Teacher Dashboard**: `GET /api/mobile/teacher/dashboard`
  - Fetches teacher's profile, today's timetable periods, assigned classes/sections/subjects, pending attendance, and recent homework.

---

## 2. Identified Functional & Data Flow Gaps

During code review of the backend controllers and mobile screen views, the following critical gaps were identified:

### 2.1 Hardcoded Homework Submission Status
In `mobileController.ts` at line 939:
```typescript
status: h.dueDate < new Date() ? 'submitted' : 'pending',
```
> [!WARNING]
> **No Real Homework Submissions Exist**: The mobile app dynamically mocks the homework status based on the due date. The database schema does not have a `HomeworkSubmission` model, meaning students cannot physically upload attachments, add comments, or receive actual teacher grading feedback on assignments.

### 2.2 Parent Interface Visual Gaps
Although the backend `getParentStudentProfile` endpoint returns comprehensive child data, the parent mobile navigator (`ParentNavigator.tsx`) only provides tabs for:
1. **Home** (Dashboard)
2. **Attendance**
3. **Fees**
4. **Notices**

There are **no visual screens, tabs, or modal views** for parents to view:
* Child's Timetable
* Child's Homework
* Child's Scheduled Exams
* Child's Marks / Results / Report Cards

### 2.3 Student Homework Upload Gaps
The `StudentHomeworkScreen.tsx` lists assignments and filters them but has:
* No file selector or input field to upload homework files (PDF, images) or text descriptions.
* No button to submit homework.
* No display of actual submission status or teacher comments.

### 2.4 Teacher Marks Entry & Visibility Gaps
While teachers can view their timetable and mark attendance on mobile:
* There are **no API endpoints** in `mobileController.ts` for teachers to view class marks, edit results, or submit grades.
* There is **no UI** on the teacher's dashboard to input student marks.
* Teachers cannot view exam listings on mobile.
