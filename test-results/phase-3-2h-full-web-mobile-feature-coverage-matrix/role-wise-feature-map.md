# Role-Wise Feature Map

This document breaks down system capabilities and access rights across all user roles, comparing the Web Console and Mobile platforms.

---

## 🔑 1. Super Admin & Admin Roles

### Web Console
* **Full Access**: Has full access permissions to all modules in the platform.
* **School Management**: Setup school entities, default terms, and billing cycles.
* **Student & Sibling Management**: Execute enrollments, edit profile demographics, manage parent bindings.
* **HR Manager**: Hire teachers and assign classes, manage clerks/staff accounts.
* **Financial Controller**: Build fee structures, collect fees, issue payment receipts, run collection audits.
* **Platform Customizer**: Enable/disable feature toggles (Exams, Homework, Admissions) globally, edit role permissions.
* **Archive & System Control**: Run database backups, manage archiving tasks.

### Mobile App
* **No Mobile Access**: Admin dashboard access is restricted to the Web Console by design.

---

## 📝 2. Clerk (Staff) Role

### Web Console
* **Front-Office Operations**: Manage online admission applications and enquiries.
* **Student Registrar**: Edit active student demographic metrics, complete enrollment wizard.
* **Attendance Clerk**: Record class-wide daily attendance.
* **Fee Collection**: Accept fee payments at the billing counter, print payment receipts.
* **Notice Board Circulars**: Publish general school notices.
* **Read-Only / Blocked Modules**: Cannot configure fee structures, schedule exams, set up timetables, or edit system settings.

### Mobile App
* **No Mobile Access**: Staff/Clerk accounts are restricted to the Web Console.

---

## 👩‍🏫 3. Teacher Role

### Web Console
* **Academics**: View assigned sections, view student list, view timetable schedulers.
* **Attendance**: Mark daily class attendance.
* **Homework**: Post class homework assignments.
* **Exams & Marks**: Schedule tests, input student subject grades in the gradebook grid.
* **Notices**: Read announcements boards.

### Mobile App
* **Teacher Home Dashboard**: Real-time shortcut panels for pending attendance, homework assignments, and notices.
* **Mobile Attendance**: Daily class rosters checklist. Toggles present/absent/late status.
* **Mobile Timetable**: Personal daily/weekly schedule.
* **Mobile Homework Manager**: View assignments lists, open submission files, enter review feedback and marks.
* **Mobile Marks Entry**: Enter assessment marks, validates scores against `maxMarks`.
* **Notices Feed**: View bulletins.

---

## 👨‍🎓 4. Student Role

### Web Console
* **Read-Only Portals**:
  * Dashboard summaries.
  * Timetable schedules.
  * View attendance reports.
  * Check billing statuses.
  * Read notice boards.

### Mobile App
* **Dashboard Feed**: View homework tasks, exam announcements, and notices.
* **Mobile Timetable**: Weekly period schedule grid.
* **Mobile Homework Portal**: View assignments, write submission text, upload attachments.
* **Mobile Exams & Results**: View test schedules, check marks cards and percentage rankings.

---

## 👥 5. Parent Role

### Web Console
* **Read-Only Sibling Dashboard**: Switch profile contexts, review attendance metrics, check outstanding fees, view academic timetables, and download report card PDFs.

### Mobile App
* **Dashboard Sibling Switcher**: Profile switcher context for parents with multiple children enrolled in the school.
* **Mobile Sibling Profile**: Comprehensive personal profiles, emergency details.
* **Mobile Attendance visualizer**: Calendar-style monthly matrix of child's present/absent flags.
* **Mobile Academics Feed**: Timetables, exam schedules, homework trackers, marks cards, grades, and teacher feedback.
* **Mobile Fees**: Real-time outstanding ledger status (amount billed, amount paid, status badges).
* **Mobile Notices Board**: Announcements feed with detail views.
