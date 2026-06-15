# Web Baseline Configurations and Audited Database State

This document captures the baseline academic configuration and database state verified during the Phase 3.1A audit. It acts as the source of truth against which mobile data parity is assessed.

---

## 1. Database Seed State Baseline

An direct audit of the active Prisma database records reveals the following current entities:

### 1.1 Registered Users
* **Parent**:
  - **Name**: John Doe / Mary Doe
  - **Email**: `parent@school.com`
  - **Linked Children**: 1 (`Jane Doe`)
* **Student**:
  - **Name**: Jane Doe
  - **Email**: `student@school.com`
  - **Admission Number**: `ADM-2025-0001`
  - **Assigned Class**: `Class 1` (ID: `0b82b4fa-1cbe-4e4e-bd40-11a0b1a74fe1`)
  - **Assigned Section**: `A` (ID: `30e1dc8a-e932-47aa-8bd9-890186bda2dc`)
* **Teacher**:
  - **Name**: Class Teacher
  - **Email**: `teacher@school.com`
  - **Employee ID**: `EMP-TCH-001`

### 1.2 Teacher Assignments
* **Class Teacher Duty**: Section A (Class 1)
* **Subject Teacher Duty**: Class 1 - Section A - Subject: Mathematics (ID: `de058695-8f25-4a5b-8818-4c9eeb0a28cd`)

---

## 2. Academic Record Counts in Database

Direct audit of the academic data models inside the database yields:
* **Timetables**: `0`
* **Homework Assignments**: `0`
* **Exams Scheduled**: `0`
* **Exam Results / Marks**: `0`

> [!NOTE]
> This state of empty records explains why both web and mobile dashboard widgets display empty states (e.g. "No Homework Found", "No upcoming exams"). Data must be populated via the web console or custom scripts to test the actual data flow on mobile.

---

## 3. Web Console Architecture & Flow Reference

The Web Console (Vite-based SPA) interacts with the same backend MySQL database via the following service controllers and paths:
* **Homework**: Controlled via `moduleController.ts` ([getHomework](file:///Users/amroy/Desktop/ERP/server/src/controllers/moduleController.ts#L1933)). Allows teachers or administrators to CRUD assignments.
* **Timetables**: Controlled via `moduleController.ts` ([getTimetable](file:///Users/amroy/Desktop/ERP/server/src/controllers/moduleController.ts#L619)).
* **Exams**: Controlled via `examController.ts`. Admin configures exams, dates, and statuses.
* **Results / Marks**: Handled via `ExamService.ts` (`submitResults` upserts student marks in the `Result` model).

Any database records generated or modified by these endpoints must be successfully reflected in real-time across both the Web Console and the Mobile App.
