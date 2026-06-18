# Backend Route Coverage Mapping

This document lists all backend routers, API endpoints, database models, and shared services supporting the Web Console and Mobile App.

---

## 💾 Prisma Database Schema Models
* **User**: Authenticated profiles, hashed passwords, roles (`admin`, `teacher`, `student`, `parent`, `clerk`).
* **Student & Parent**: Student details, enrollment metrics, parent-child sibling mapping records.
* **Teacher & Staff**: Department assignments, subject specializations, job statuses.
* **Attendance**: Daily status logs. Dates are strictly stored at UTC midnight (`00:00:00.000Z`).
* **Timetable & TimetableEntry**: Weekly scheduling data.
* **Homework & HomeworkSubmission**: Assignments, student submission texts, and download links.
* **Exam & Result**: Assessment schedulers, individual marks, percentages, grades, and remarks.
* **FeeStructure, StudentFee, FeePayment & FeePaymentAllocation**: Student bills, collections logs, payment-to-structure allocations.
* **Notice**: Broadcast circulars filtered by target roles (`all`, `teacher`, `parent`, `student`).
* **DeviceToken**: Firebase Cloud Messaging (FCM) tokens mapped by device type (`ios`, `android`, `web`).

---

## 🌐 API Route Configurations

### 1. Web API Routes (`server/src/routes/`)
* **Auth**: `/api/auth/login` (generates JWT token), `/api/auth/logout`, `/api/auth/me`.
* **Dashboard**: `/api/dashboard/summary` (admin dashboard summary stats, fee collection numbers).
* **Student Manager**: `/api/students` (CRUD), `/api/students/:id/attendance` (scoped statistics).
* **Admissions**: `/api/admissions` (pipeline tracker), `/api/admissions/new`, `/api/admissions/:id/approve` (converts to student).
* **Attendance Ledger**: `/api/attendance` (mark and retrieve class-date rosters).
* **Timetable Schedule**: `/api/timetable` (assign sections/classes/period slots).
* **Homework Manager**: `/api/homework` (CRUD homework, review and evaluate submission feedback).
* **Exams & Gradebook**: 
  * `/api/exams` (Exam schedule creation).
  * `/api/exams/:examId/gradebook` (completion analytics).
  * `/api/exams/:examId/subjects/:subjectId/marks` (marks checklist).
  * `/api/exams/:examId/subjects/:subjectId/marks/save` (upsert mark, calculate grade/percentage).
  * `/api/exams/results/student/:studentId` (student academic results tracker).
* **Fees Manager**:
  * `/api/fees/structures` (CRUD fee structures).
  * `/api/fees/collect` (payment transaction recorder, logs mode, issues receipt numbers, maps payment allocations).
  * `/api/fees/payments` (ledger history).
* **Notices**: `/api/notices` (publish circulars).
* **Modules Settings**: `/api/settings/modules` (toggles dashboard modules globally).

---

### 2. Mobile API Routes (`server/src/routes/mobileRoutes.ts`)
All mobile app endpoints are prefix-routed to `/api/mobile/*` and run through the `protect` authentication guard:

| Endpoint Path | Controller Handler | Purpose |
|---|---|---|
| **POST** `/devices/register` | `registerDevice` | FCM token registration |
| **POST** `/devices/unregister` | `unregisterDevice` | FCM token removal |
| **GET** `/parent/dashboard` | `getParentDashboard` | Child selector summaries |
| **GET** `/parent/student-profile/:studentId` | `getParentStudentProfile` | Sibling detail dashboard |
| **GET** `/parent/attendance` | `getParentAttendance` | Monthly attendance visualizer |
| **GET** `/parent/fees` | `getParentFees` | Child's outstanding bills |
| **GET** `/parent/notices` | `getParentNotices` | Parent notifications list |
| **GET** `/parent/student/:studentId/timetable` | `getParentChildTimetable` | Student schedule feed |
| **GET** `/parent/student/:studentId/homework` | `getParentChildHomework` | Assignment dashboard |
| **GET** `/parent/student/:studentId/exams` | `getParentChildExams` | Test schedules |
| **GET** `/parent/student/:studentId/results` | `getParentChildResults` | Marks, feedback, grades |
| **GET** `/student/dashboard` | `getStudentDashboard` | Dashboard overview |
| **GET** `/student/timetable` | `getStudentTimetable` | Student schedule feed |
| **GET** `/student/homework` | `getStudentHomework` | Homework calendar details |
| **GET** `/student/exams` | `getStudentExams` | Exam card tracker |
| **GET** `/student/results` | `getStudentResults` | Personal results checklist |
| **GET** `/student/homework/:homeworkId/submission` | `getStudentHomeworkSubmission` | Get submission info |
| **POST** `/student/homework/:homeworkId/submit` | `submitStudentHomework` | Upload answer/files |
| **GET** `/teacher/dashboard` | `getTeacherDashboard` | Shortcuts & notices widget |
| **GET** `/teacher/timetable` | `getTeacherTimetable` | Weekly timetable visualizer |
| **GET** `/teacher/notices` | `getTeacherNotices` | Notices feed |
| **GET** `/teacher/attendance-classes` | `getTeacherAttendanceClasses` | Assigned classes roster |
| **GET** `/teacher/attendance-students` | `getTeacherAttendanceStudents` | Class attendance list |
| **POST** `/teacher/attendance-submit` | `submitTeacherAttendance` | Save attendance |
| **GET** `/teacher/homework` | `getTeacherHomework` | List created homework |
| **GET** `/teacher/homework/:homeworkId/submissions` | `getTeacherHomeworkSubmissions` | List student submissions |
| **GET** `/teacher/homework/submissions/:submissionId` | `getTeacherSubmissionDetail` | Detail submission view |
| **PATCH** `/teacher/homework/submissions/:submissionId/review` | `reviewTeacherSubmission` | Record feedback/marks |
| **GET** `/teacher/homework/submissions/:submissionId/download` | `downloadTeacherSubmissionFile` | Retrieve file attachments |
| **GET** `/teacher/marks/exams` | `getTeacherMarksExams` | List exam selectors |
| **GET** `/teacher/marks/exams/:examId/subjects` | `getTeacherMarksExamSubjects` | View classes/subjects |
| **GET** `/teacher/marks/exams/:examId/students` | `getTeacherMarksExamStudents` | Select students for marks entry |
| **POST** `/teacher/marks/exams/:examId/save` | `saveTeacherMarks` | Save marks |

---

## 🛠️ Shared Services and Helpers

### 1. `FeeService` (`server/src/services/FeeService.ts`)
* **Functions**: Calculates fee status, updates billing records, fetches student fee profiles, handles collection transactions.
* **Shared Usage**: Shared between web collections APIs and mobile parent fee displays.

### 2. `ExamService` (`server/src/services/ExamService.ts`)
* **Functions**: Automatically computes marks percentages, determines letter grades based on standard scale ranges, resolves gradebook totals.
* **Shared Usage**: Shared between web marks entry, mobile student result lists, and mobile parent academic tabs.

### 3. `PushNotificationService` (`server/src/services/PushNotificationService.ts`)
* **Functions**: Manages triggers for push messages, interfaces with Firebase Cloud Messaging, queues notifications.
* **Shared Usage**: Integrates across controllers for homework assignments, marks publishing, fee reminders, and attendance anomalies.
