# Web Module Inventory

This inventory documents all feature modules, screens, and primary components in the School ERP Web Console.

---

## 🖥️ Core Modules and Screens

### 1. Dashboard (`/dashboard`)
* **Purpose**: Primary analytics landing page for admins, principal, and managers.
* **Key Components**:
  * Quick Stats Panel (Active Students, Total Teachers, Total Staff, Active Enquiries).
  * Academic Performance Chart (average exam performance over time).
  * Fee Collections Widget (monthly bar/pie charts).
  * Recent Notices Board.
  * System Activity Log Feed.
* **Access Control**: Scoped by `dashboard:view` and `dashboard:full`.

### 2. Students & Parents (`/students`, `/parents`)
* **Purpose**: Manage active student enrollment records, academic metadata, and parent contact associations.
* **Key Components**:
  * Student Directory (search, sort, filter by class/section).
  * Student Profile Details Page (demographics, emergency contacts, sibling linkages, enrollment history).
  * Parent Directory (parent accounts, contact info, linked children list).
  * Student Registration Form (multi-step wizard, document attachments).
* **Access Control**: Scoped by `student:view`, `student:create`, `student:update`, `student:delete`, `parent:view`.

### 3. Admissions (`/admissions`)
* **Purpose**: Manage the intake pipeline, online enquiry conversions, document reviews, and application workflows.
* **Key Components**:
  * Admission Applications List (status tracking: `new`, `under_review`, `accepted`, `rejected`).
  * Student Details Form Page & Document upload check.
  * Approval Workflow Controller (converts accepted applicants directly into active student records).
* **Access Control**: Scoped by `admission:view`, `admission:create`, `admission:approve`.

### 4. Staff & Teachers (`/staff`, `/teachers`)
* **Purpose**: Human resource records management for school employees.
* **Key Components**:
  * Teacher Directory (subject specialties, class-teacher assignments).
  * Staff Directory (clerks, administrators, drivers, security).
  * Employee Details Forms (joining dates, payroll parameters, user profile mapping).
* **Access Control**: Scoped by `teacher:view`, `teacher:create`, `staff:view`, `staff:create`.

### 5. Attendance (`/attendance/students`, `/attendance/staff`)
* **Purpose**: Daily registration grid and compliance tracking.
* **Key Components**:
  * Attendance Marking Sheet (class/section date-specific list with Present/Absent/Late status radios).
  * Single Student Attendance summary widget.
  * Attendance Compliance Reports (by day, student, or section).
* **Access Control**: Scoped by `attendance:view`, `attendance:mark`.

### 6. Timetable (`/timetable`)
* **Purpose**: Schedule grid configuration for classes, sections, subjects, and rooms.
* **Key Components**:
  * Timetable Configuration Grid (interactive class-period slot manager).
  * Teacher Schedule Matrix (checks for double-booking conflicts).
* **Access Control**: Scoped by `timetable:view`, `timetable:manage`.

### 7. Homework (`/homework`)
* **Purpose**: Create, assign, review, and return student homework submissions.
* **Key Components**:
  * Homework Manager (create assignments with titles, due dates, instructions, file attachments).
  * Submissions Roster Dashboard (aggregates class submission ratios: `submitted` / `reviewed` / `pending`).
  * Homework Review Modal (marks entry, written feedback form, status updates: `reviewed` or `returned`).
* **Access Control**: Scoped by `homework:view`, `homework:create`.

### 8. Exams & Report Cards (`/exams`, `/exams/marks`, `/exams/results`)
* **Purpose**: Set up grade periods, manage subject maximums, and record marks.
* **Key Components**:
  * Exam Scheduler (create terms, assign classes, configure subjects/date ranges).
  * Gradebook Enriched Dashboard (subject-wise completion metrics).
  * Class-subject Marks Grid (marks entry list with auto percentage/grade mapping).
  * Student Report Card summary view.
* **Access Control**: Scoped by `exam:view`, `exam:create`, `exam:marks_entry`.

### 9. Fees (`/fees`, `/fees/structures`, `/fees/collect`, `/fees/payments`)
* **Purpose**: School billing, allocations, collections, and transactions tracking.
* **Key Components**:
  * Fee Structure Creator (define termly/annual structures, tuition amounts, admission additions).
  * Fee Payment Collection Screen (receipt number generation, select bank/cash mode, allocate parts).
  * Transactions Log (search payments list, export spreadsheets, print receipts).
* **Access Control**: Scoped by `fee:view`, `fee:create`, `fee:collect`.

### 10. Notices (`/notices`)
* **Purpose**: Broadcast bulletins and upload attachments.
* **Key Components**:
  * Notice Board CRUD Page.
  * Target Audience Filters (All/Teachers/Parents/Students).
* **Access Control**: Scoped by `notice:view`, `notice:create`.

### 11. Settings, Roles & Security (`/settings`, `/roles`)
* **Purpose**: Access permissions configuration, feature toggle parameters, and system backups.
* **Key Components**:
  * Feature Module Toggles (disable Homework, Exams, Admissions, etc., across the whole platform).
  * Role Permission Configurator (custom matrix rules for Admin, Teacher, Student, Parent, Clerk).
  * Archive and Backups dashboard.
* **Access Control**: Scoped by `settings:view`, `settings:update`, `role:view`, `role:manage`.
