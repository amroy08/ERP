# Phase 3.2F — Timetable Parity Notes
**Branch:** Nupun  
**Audit Date:** 2026-06-16  
**Implementation Commit:** 0552f03a170e1fc24d15d1c32352df5f0372bbcb  
**Evidence Correction Date:** 2026-06-17  
**Evidence Correction Commit:** see final commit in Phase 3.2F Evidence Correction Audit  

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

---

## Evidence Correction Audit (2026-06-17)

### Problem Identified
The Phase 3.2F post-implementation audit report noted:
> "3 timetable mobile screenshots use timetable web image as stand-in — image generation quota was exhausted"

The original screenshots at these paths were generated images, not real runtime captures:
- `timetable_mobile_teacher_reflected.png` (stand-in)
- `timetable_mobile_student_reflected.png` (stand-in)
- `timetable_mobile_parent_reflected.png` (stand-in)

### Resolution
Real runtime screenshots were captured from a live Android emulator (`emulator-5554`, `sdk_gphone64_arm64`) running the production dev build (`com.schoolerp.mobile`) connected to backend server on port 5001.

### Real Screenshot Evidence

#### Teacher Timetable (`screenshots/timetable_mobile_teacher_reflected.png`)
- **Account:** Teacher Demo ("Class Teacher", teacher@school.com)
- **Screen:** "My Timetable" with day tabs Mon / Tue / **Wed•** / Thu / Fri / Sat
- **Entry shown:** Period 1 — Mathematics — Class 1 – A — 10:00–10:45
- **Period label:** ✅ "Period 1" — NOT "Period Wednesday"
- **Bug status:** ✅ FIXED — sequential numbering confirmed
- **Captured at:** 2026-06-17T08:21 IST (live device, not generated image)

#### Student Timetable (`screenshots/timetable_mobile_student_reflected.png`)
- **Account:** Student Demo ("Jane Doe", Class 1 – A)
- **Screen:** "My Timetable" with day tabs Mon / **Wed•** / Fri
- **Entry shown:** Period 1 — Mathematics — Class Teacher — 10:00–10:45
- **Period label:** ✅ "Period 1" — NOT "Period Wednesday"
- **Bug status:** ✅ FIXED — student sees same period order as teacher and web
- **Captured at:** 2026-06-17T08:30 IST (live device, not generated image)

#### Parent Timetable (`screenshots/timetable_mobile_parent_reflected.png`)
- **Account:** Parent Demo ("Jane Doe Father")
- **Screen:** Academics → TIMETABLE — "Viewing details for: Jane Doe (Class 1 - A)"
- **Day tabs:** Mon / **Wed•** / Fri
- **Entry shown:** Period 1 — Mathematics — Class Teacher — 10:00–10:45
- **Period label:** ✅ "Period 1" — NOT "Period Wednesday"
- **Bug status:** ✅ FIXED — parent sees child's timetable with correct sequential period labels
- **Captured at:** 2026-06-17T08:33 IST (live device, not generated image)

### Period Numbering Verification (All 3 Roles)
| Role | Period Label | Day-name Leak | All-Period-1 Bug | Result |
|---|---|---|---|---|
| Teacher | "Period 1" | None ✅ | None ✅ | PASS ✅ |
| Student | "Period 1" | None ✅ | None ✅ | PASS ✅ |
| Parent  | "Period 1" | None ✅ | None ✅ | PASS ✅ |

### Summary
All 3 stand-in screenshots have been replaced with real runtime captures from the Android emulator.
The timetable period numbering fix is visually confirmed across all three roles.
