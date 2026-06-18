# Phase 4.0: Real Data Inventory

## Database: `school_erp` (Live MySQL)
**Snapshot taken**: 2026-06-18
**Branch**: Nupun / HEAD: `5f9acd021655db166ad8d040e0a4844f68aa8e81`

---

## Record Counts

| Entity | Count | Notes |
|---|---|---|
| `schools` | 1 | Single-tenant deployment |
| `academic_years` | 1 | `2025-26` active (Apr 2025 – Mar 2026) |
| `classes` | 10 | Class 1 through Class 10 |
| `sections` | 20 | Two sections (A/B) per class; one is active/populated per class |
| `subjects` | 10 | Core subject catalogue |
| `students` | 274 | Across all active sections |
| `users` (role=TEACHER) | 8 | Including the primary test teacher |
| `users` (role=PARENT) | 269 | Pattern: `parent.adm<id>@school.local` |
| `users` (role=STUDENT) | ~274 | One login per student |
| `users` (role=ADMIN) | 1 | `admin@school.com` |
| `admissions` | 16 | Historic admission records |
| `enquiries` | 0 | No pending enquiries |
| `homework` | 3 | Real homework assignments |
| `homework_submissions` | 2 | Student submissions on file |
| `exams` | 3 | See exam details below |
| `results` | 5 | Marks for select students/subjects |
| `attendance` | 32 | Attendance rows on record |
| `timetable_entries` | 3 | Timetable slots |
| `fee_structures` | 4 | See fee details below |
| `student_fees` | 805 | 802 pending, 3 partial |
| `fee_payments` | 52 | Historic payment records |
| `notices` | 4 | Published notices |

---

## Class-Section Enrollment Snapshot

| Class | Section | Students |
|---|---|---|
| Class 1 | A | 28 |
| Class 2 | B | 27 |
| Class 3 | A | 33 |
| Class 4 | B | 27 |
| Class 5 | A | 28 |
| Class 6 | B | 27 |
| Class 7 | A | 26 |
| Class 8 | B | 26 |
| Class 9 | A | 26 |
| Class 10 | B | 26 |

*The "B" sections for odd classes and "A" sections for even classes are empty (0 students).*

---

## Exam Records

| Exam Name | Type | Start Date | End Date |
|---|---|---|---|
| Quarterly Mathematics Quiz | quiz | 2026-06-05 | 2026-06-05 |
| Phase 3.2D Sync Exam | internal | 2026-06-20 | 2026-06-21 |
| First Term Examination | written | 2026-06-30 | 2026-07-05 |

**Results (marks)**: 5 records across select students and subjects.

---

## Fee Structures

| Name | Total Amount | Class |
|---|---|---|
| Phase 3.2G Fee Sync Check | ₹4,500 | Class 1 |
| Term 1 Fee | ₹20,000 | (no class) |
| Books & Stationery | ₹10,000 | (no class) |
| Tuition Fee | ₹10,000 | (no class) |

**Student fee statuses**: 802 `pending`, 3 `partial`
**Fee payment records**: 52 transactions

---

## Homework Assignments

3 homework records exist. 2 student submissions on file.
Specific homework: to be queried during execution for teacher email/class mapping.

---

## Notices

4 notices published. To be reviewed during UAT for audience targeting (TEACHER, PARENT, STUDENT, ALL).

---

## Attendance

32 attendance records exist for real students.

---

## Test Credentials

> **IMPORTANT**: All passwords below must be verified via the server API login endpoint during UAT setup.

### Web Console (Admin)
| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@school.com` | `Admin@123` | Verified — system default |

### Mobile — Teacher
| Role | Email | Password | Notes |
|---|---|---|---|
| Primary Teacher | `teacher@school.com` | *(verify before use)* | Existing account |
| Alt Teacher | `tea.alice.0070@school.local` | *(verify before use)* | Demo-populated |

### Mobile — Student
| Role | Email | Password | Notes |
|---|---|---|---|
| Student 1 | `stu.adm20267672@school.local` | `Student@123` | Default password |
| Student 2 | `stu.adm20268263@school.local` | `Student@123` | Default password |
| Student 3 | `stu.adm20264757@school.local` | `Student@123` | Default password |

### Mobile — Parent
| Role | Email | Password | Notes |
|---|---|---|---|
| Parent 1 | `parent.adm20267881@school.local` | *(verify before use)* | Meera Kapoor |
| Parent 2 | `parent.adm20265789@school.local` | *(verify before use)* | Ayan Sethi |
| Parent 3 | `parent.adm20269283@school.local` | *(verify before use)* | Dhruv Iyer |

> **Note**: For parent and teacher accounts created via the admission conversion flow, the
> password is auto-generated or set at conversion time. Must confirm via admin reset or
> known credential before UAT login steps.

---

## Academic Year Context
- **Active Year**: `2025-26` (`isCurrent = 1`)
- **Date Range**: 2025-04-01 to 2026-03-31
- All student fees, homework, and exams are scoped to this academic year

---

## DB Backup Command (Pre-UAT)
```bash
mysqldump -u root -p school_erp > school_erp_uat_backup_$(date +%Y%m%d_%H%M%S).sql
```
Run this **before** any write-heavy UAT flows (fee collection, marks submission, attendance submission).
