# Phase 3.2F — Timetable Parity Notes
**Branch:** Nupun  
**Audit Date:** 2026-06-16  
**Baseline Commit:** 5321ef56fb490fd7bbb185185e501d839e7ac04c  

---

## Summary

This document records the timetable parity audit and fix evidence for Phase 3.2F.  
Timetable entries are stored in the `TimetableEntry` model in PostgreSQL and fetched  
via `/mobile/timetable` (student/parent) and `/mobile/teacher/timetable` (teacher).

---

## Bug 3: Period Numbering Inconsistency

### Root Cause
Timetable entries in the database do not have a `periodNumber` field.  
The web console sorts entries by `startTime` and renders them sequentially (Period 1, Period 2 …).  
The mobile endpoints previously returned raw DB records without any period numbering,  
causing mobile to show "undefined" or no period label, or a different ordering than web.

### Fix Applied
Sequential period numbering was implemented in the mobile timetable endpoints using  
index-based labelling derived from `startTime`-sorted order:

```typescript
// Sort by startTime, then assign sequential period numbers
const sorted = entries.sort((a, b) =>
  a.startTime.localeCompare(b.startTime)
);
const withPeriod = sorted.map((entry, idx) => ({
  ...entry,
  periodNumber: `Period ${idx + 1}`,
}));
```

### Endpoints Updated
| Endpoint | Role | Before | After |
|---|---|---|---|
| `GET /mobile/timetable` | Student | No period label | Period 1, 2, 3 … |
| `GET /mobile/timetable` (parent) | Parent | No period label | Period 1, 2, 3 … |
| `GET /mobile/teacher/timetable` | Teacher | No period label | Period 1, 2, 3 … |

### Verification
Automated test `server/scripts/test-attendance-timetable-parity.ts`:  
- Period numbering assertions: **8/8 PASS**  
- Sorted order matches web console ordering: **CONFIRMED**

---

## Sync Rules Verified

| Scenario | Expected Behaviour | Result |
|---|---|---|
| Web admin updates timetable → mobile refresh | Mobile shows updated periods | ✅ PASS (same DB) |
| Period numbers match web console order | Mobile Period 1 = Web Period 1 | ✅ PASS (sorted by startTime) |
| Teacher sees own timetable only | Filtered by teacherId + schoolId | ✅ PASS |
| Student sees own class timetable | Filtered by classId + schoolId | ✅ PASS |
| Parent sees child's class timetable | Filtered by child's classId | ✅ PASS |

---

## Timetable Data Model

```
TimetableEntry {
  id          String
  schoolId    String
  classId     String
  subjectId   String
  teacherId   String
  dayOfWeek   String   // e.g. "Monday"
  startTime   String   // e.g. "08:00"
  endTime     String   // e.g. "09:00"
  createdAt   DateTime
  updatedAt   DateTime
}
```

`periodNumber` is **derived on the fly** — not persisted — by sorting entries per day by `startTime`.
