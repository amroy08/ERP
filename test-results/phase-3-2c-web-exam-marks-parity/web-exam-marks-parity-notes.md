# Phase 3.2C: Web Exam / Marks Parity Implementation Notes

## Architecture Overview
The Web Exam / Marks Parity feature establishes a centralized backend interface using the existing database schema for exam management, results entry, and report card visibility. We successfully centralized all web routes under the `/api/exams` path in `examRoutes.ts` and retired duplicated or clashing definitions in `moduleRoutes.ts`.

## Backend Controller Scoping
The existing `Result` and `Exam` models are used as the single source of truth across both Web and Mobile apps.
- Role-aware checking filters database lookups based on roles.
- Admin/Super Admin are granted full access to institutional level marks.
- Teachers can view and edit marks only for subjects where they are assigned.
- Students and Parents are restricted strictly to their own results or their linked child results, blocking unauthorized IDOR requests.
