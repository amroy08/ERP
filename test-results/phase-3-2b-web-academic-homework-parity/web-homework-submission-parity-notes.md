# Phase 3.2B — Web Homework Submission Parity Notes

## Audit Date
2026-06-16

## Branch
Nupun

## Base Commit
b2d2bf4309ae7184ca6744e10f2c0692d5aa0a0a (Phase 3.2A)

## What Was Implemented

### Backend (server)
New shared homework submission endpoints added to `moduleController.ts` and registered in `moduleRoutes.ts`:

| Endpoint | Method | Role Access |
|---|---|---|
| `/api/homework/:homeworkId/submissions` | GET | Admin, Super Admin, Teacher (scoped) |
| `/api/homework/submissions/:submissionId` | GET | Admin, Super Admin, Teacher (scoped) |
| `/api/homework/submissions/:submissionId/review` | PATCH | Admin, Super Admin, Teacher (scoped) |
| `/api/homework/submissions/:submissionId/download` | GET | Admin, Super Admin, Teacher (scoped) |

All 4 endpoints blocked for `student` and `parent` roles (403).

### Frontend (client)
`HomeworkPage.tsx` rebuilt with full submissions review UI:
- Homework list cards are clickable (opens submissions view)
- Submissions view: stats bar, filter tabs, student table
- Review modal: submission text, file download, feedback, marks, Mark Reviewed, Return buttons

## Parity Mechanism
- Both web and mobile use the same Prisma/MySQL database
- No duplicate tables, caches, or mock data
- Web action → immediate reflection on mobile (on refresh)
- Mobile action → immediate reflection on web (on refresh)

## Files Changed
- `server/src/controllers/moduleController.ts` — 4 new endpoint functions
- `server/src/routes/moduleRoutes.ts` — 4 new route registrations
- `client/src/features/homework/HomeworkPage.tsx` — full UI rewrite
- `server/scripts/test-web-homework-submission-parity.ts` — test script
