# Recommended Implementation Phases

This document provides a phased checklist for addressing the academic data parity issues and implementing the requested mobile workflows.

---

## Phase 1: Teacher Visibility Fixes & Academic Mock Seeding

### 1.1 Backend Visibility Fix
- [ ] Update `getTeacherDashboard` in `mobileController.ts` to include `classTeacherOf: { include: { class: true } }`.
- [ ] Update the mapping logic in `getTeacherDashboard` to add Class Teacher sections and classes to `sectionsMap` and `classesMap` correctly with `className`.

### 1.2 Seed Mock Academic Data
- [ ] Create a seeding script to populate `Timetable`, `TimetableEntry`, `Homework`, `Exam`, and `Result` records in the database.
- [ ] Ensure that mock assignments map to Class 1 - A (matching student `student@school.com` and parent `parent@school.com` child).

---

## Phase 2: Parent Portal Expansion

### 2.1 UI/UX Screen Development
- [ ] Create `ParentTimetableScreen.tsx` to view the selected child's active timetable.
- [ ] Create `ParentHomeworkScreen.tsx` to list homework assignments and status.
- [ ] Create `ParentExamsScreen.tsx` to display upcoming exam schedules.
- [ ] Create `ParentResultsScreen.tsx` to view published report cards.

### 2.2 Navigation Integration
- [ ] Update `ParentNavigator.tsx` to register the new screens (either as bottom tabs or sub-nav links from the Home Screen).
- [ ] Apply premium styling (using parent role themes, clear layouts, card designs, and refresh controls).

---

## Phase 3: Student Homework Submission Workflow

### 3.1 Schema & API Endpoints
- [ ] Design and implement a `HomeworkSubmission` model in `schema.prisma` mapping a student's response (file attachment, text comment, submission time, and grade/feedback status) to a `Homework` entry.
- [ ] Add backend endpoints to:
  - Submit homework (`POST /api/mobile/student/homework/:homeworkId/submit`).
  - Get submission status (`GET /api/mobile/student/homework/:homeworkId/submission`).
  - Retrieve submissions for a teacher (`GET /api/mobile/teacher/homework/:homeworkId/submissions`).
  - Grade a submission (`POST /api/mobile/teacher/submissions/:submissionId/grade`).

### 3.2 Mobile Screens Integration
- [ ] Update `StudentHomeworkScreen.tsx` to display a submission modal allowing text entry and document uploads.
- [ ] Display real submission status (Pending, Submitted, Graded) and teacher feedback.

---

## Phase 4: Teacher Gradebook & Marks Entry

### 4.1 Backend Endpoints
- [ ] Add mobile endpoints for teachers:
  - List exams for assigned classes (`GET /api/mobile/teacher/exams`).
  - Get student list for a class/section with their current marks for an exam/subject (`GET /api/mobile/teacher/exams/:examId/sections/:sectionId/subjects/:subjectId/marks`).
  - Bulk upsert marks (`POST /api/mobile/teacher/exams/:examId/sections/:sectionId/subjects/:subjectId/marks`).

### 4.2 Gradebook UI Screens
- [ ] Build a `TeacherGradebookScreen` on mobile where teachers can select Class -> Section -> Subject -> Exam.
- [ ] Implement an editable list/grid of students with input fields to quickly enter and save marks.
- [ ] Ensure inputted marks sync to the database and are instantly visible to students/parents.
