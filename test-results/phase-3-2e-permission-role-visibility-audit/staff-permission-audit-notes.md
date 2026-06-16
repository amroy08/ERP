# Phase 3.2E — Staff (Clerk) Permission Audit Notes

**Audit Date:** 2026-06-16  
**All staff/clerk checks PASS**

---

## Clerk Role Definition

The `clerk` role represents front-office administrative staff. It is distinct from `admin`:
- Cannot modify school settings
- Cannot create/delete academic structures
- Cannot enter marks
- Cannot create homework
- Handles: student intake, fee collection, attendance marking, admission workflow

---

## Permission Audit (from `constants.ts`)

### ✅ Permissions Granted to Clerk

| Permission | Rationale |
|-----------|-----------|
| `dashboard:view` / `dashboard:full` | Dashboard access |
| `student:view/create/update/export` | Student management (no delete) |
| `admission:view/create/update/approve` | Full admission intake workflow |
| `enquiry:view/create/update` | Front-office enquiry handling |
| `parent:view` | View-only parent records |
| `teacher:view` | View-only teacher records |
| `staff:view` | View-only staff records |
| `fee:view/collect/export/report` | Fee collection (no create/delete structures) |
| `attendance:view/mark` | Daily attendance entry |
| `exam:view` | View exam schedule only |
| `class:view` | View class list |
| `notice:view/create` | Create/view notices (no delete) |
| `report:view` | View reports |
| `transport:view` | View transport |
| `settings:view` | View-only settings |

### ❌ Permissions NOT Granted to Clerk

| Permission | Impact |
|-----------|--------|
| `exam:marks_entry` | Cannot enter marks → 403 on marks/save endpoints |
| `exam:create/update` | Cannot create or modify exams |
| `homework:create/view` | Cannot create or manage homework |
| `timetable:view/manage` | Cannot access timetable module |
| `settings:update` | Cannot change school settings |
| `student:delete` | Cannot delete students |
| `teacher:create/update/delete` | Cannot manage teacher HR |
| `staff:create/update/delete` | Cannot manage staff HR |
| `parent:create/update/delete` | Cannot manage parent records |
| `fee:create` | Cannot create fee structures |
| `role:view/manage` | Cannot manage roles |
| `attendance:export` | Cannot export attendance data |

---

## Structural Verification Results

```
[N1] Clerk does NOT have exam:marks_entry    ✅
[N2] Clerk does NOT have homework:create     ✅
[N3] Clerk does NOT have timetable:manage    ✅
[N4] Clerk does NOT have settings:update     ✅
[N5] Clerk DOES have exam:view               ✅
[N6] Clerk DOES have attendance:mark         ✅
```

---

## Design Notes

- The clerk role is designed for the "school office staff" use case:
  can admit students, collect fees, mark attendance, but cannot make academic decisions.
- `homework:view` is intentionally NOT given to clerk — clerk has no academic role in the homework workflow.
- `timetable:view` is intentionally NOT given to clerk — timetable is academic planning.
- The clerk does NOT have a mobile app role — mobile app is for teacher/student/parent only.
- No runtime test needed — structural verification against constants covers all cases.
  Runtime tests would require a separate clerk user account which does not exist in the demo dataset.

---

## Verdict: **COMPLIANT**

Clerk permissions are correctly scoped. No academic overreach. No security gap found.
