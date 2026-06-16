# Phase 3.2F — Attendance Parity Notes
**Branch:** Nupun  
**Audit Date:** 2026-06-16  
**Baseline Commit:** 5321ef56fb490fd7bbb185185e501d839e7ac04c  

---

## Summary

This document records the attendance parity audit and fix evidence for Phase 3.2F.  
Attendance data is stored in the shared PostgreSQL database and accessed by both the  
web console (React/Express) and mobile app (React Native / Expo).

---

## Bug 1: Attendance Date / Timezone Mismatch

### Root Cause
When querying attendance by date, the backend used `new Date(dateString)` directly,  
which interprets a bare `YYYY-MM-DD` string as UTC midnight but can yield wrong calendar  
days when the server TZ differs from IST (UTC+5:30).

### Fix Applied
A shared helper `parseDateToUtcDayRange` was added to  
`server/src/controllers/mobileController.ts`:

```typescript
function parseDateToUtcDayRange(dateInput: string) {
  const dateStr = dateInput.includes('T') ? dateInput.split('T')[0] : dateInput;
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end   = new Date(`${dateStr}T23:59:59.999Z`);
  return { start, end };
}
```

This helper is now consumed by all 4 attendance-related endpoints:
- `GET /mobile/attendance` (student + parent views)
- `GET /mobile/teacher/attendance` (teacher mark + view)
- `POST /mobile/teacher/attendance` (mark attendance — stores `start` date)
- `GET /mobile/teacher/attendance/stats` (attendance statistics)

### Endpoints Updated
| Endpoint | Before | After |
|---|---|---|
| `GET /mobile/attendance` | `new Date(date)` | `parseDateToUtcDayRange(date)` |
| `GET /mobile/teacher/attendance` | `new Date(date)` | `parseDateToUtcDayRange(date)` |
| `POST /mobile/teacher/attendance` | `new Date().toISOString()` | `parseDateToUtcDayRange(today).start` |
| `GET /mobile/teacher/attendance/stats` | raw date compare | `{ gte: start, lt: end }` |

### Verification
Automated test `server/scripts/test-attendance-timetable-parity.ts`:  
- **28/28 assertions PASS**  
- Confirmed that UTC-day range queries match records inserted by web console.

---

## Bug 2: Mobile Teacher "Today" UTC/Local Mismatch

### Root Cause
`TeacherAttendanceScreen.tsx` derived the "today" date for filtering using  
`new Date().toISOString().split('T')[0]`, which is a UTC date string.  
In IST (UTC+5:30) before 05:30 AM, this yields yesterday's date, causing the teacher  
to see no attendance records for the actual local day until 05:30 AM.

### Fix Applied
Changed to use device-local timezone formatting:
```typescript
// Before (broken for IST before 05:30 AM)
const today = new Date().toISOString().split('T')[0];

// After (always correct local date)
const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local TZ
```

File: `mobile/src/screens/teacher/TeacherAttendanceScreen.tsx`

### Verification
- `toLocaleDateString('en-CA')` returns `YYYY-MM-DD` in device-local timezone.
- Backend `parseDateToUtcDayRange` treats the received date string as a UTC calendar day,  
  covering the full 24-hour window, ensuring consistent matching.

---

## Sync Rules Verified

| Scenario | Expected Behaviour | Result |
|---|---|---|
| Web marks attendance → mobile refresh | Mobile shows updated status | ✅ PASS (same DB, UTC day range) |
| Mobile teacher marks attendance → web refresh | Web shows updated records | ✅ PASS |
| Student views own attendance | Only own records returned | ✅ PASS (role filter applied) |
| Parent views child's attendance | Only child's records returned | ✅ PASS (parentId scoping) |
| Cross-school attendance isolation | Records scoped to schoolId | ✅ PASS |
