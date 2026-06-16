# Phase 3.2F — Web ↔ Mobile Sync Notes
**Branch:** Nupun  
**Audit Date:** 2026-06-16  
**Baseline Commit:** 5321ef56fb490fd7bbb185185e501d839e7ac04c  

---

## Overview

This document describes how the web console and mobile app stay in sync for  
Attendance and Timetable data. Both surfaces share the same PostgreSQL database  
via the Express/Prisma backend. There is no separate mobile database — all writes  
from either surface are immediately visible to the other after a data refresh.

---

## Attendance Sync Flow

```
Web Console (React)                 Mobile App (React Native)
      │                                       │
      │  POST /api/attendance                 │  POST /mobile/teacher/attendance
      │  (marks attendance record)            │  (marks attendance record)
      │                                       │
      └──────────────┬────────────────────────┘
                     │
              PostgreSQL DB
              (Attendance table)
                     │
      ┌──────────────┴────────────────────────┐
      │                                       │
      │  GET /api/attendance?date=…           │  GET /mobile/attendance?date=…
      │  (reads same records)                 │  GET /mobile/teacher/attendance?date=…
      │                                       │
Web Console (reflects mobile marks)    Mobile (reflects web marks)
```

### Key Fix: UTC Day Range Normalization
Before this fix, the mobile backend used `new Date(date)` to build queries, which  
could miss records written at different UTC offsets. After the fix, both web and  
mobile use UTC midnight-to-midnight range queries:

```typescript
gte: new Date(`${dateStr}T00:00:00.000Z`),
lt:  new Date(`${dateStr}T23:59:59.999Z`),
```

This ensures attendance marked by web at any time during the calendar day is  
visible on mobile, and vice versa.

---

## Timetable Sync Flow

```
Web Console (Admin)                 Mobile App
      │                                       │
      │  POST /api/timetable                  │  (read-only, no mobile write)
      │  (creates/updates timetable entry)    │
      │                                       │
      └──────────────┬────────────────────────┘
                     │
              PostgreSQL DB
              (TimetableEntry table)
                     │
      ┌──────────────┴────────────────────────┐
      │                                       │
      │  GET /api/timetable                   │  GET /mobile/timetable
      │  (same records, sorted by startTime)  │  GET /mobile/teacher/timetable
      │                                       │
Web Console (Period 1, 2, …)         Mobile (Period 1, 2, … — now fixed)
```

### Key Fix: Sequential Period Numbering
Mobile endpoints now sort timetable entries by `startTime` and assign sequential  
`periodNumber` labels (`Period 1`, `Period 2`, …) to match the web console display.

---

## Refresh Behaviour

| Platform | How to Refresh |
|---|---|
| Web Console | Navigate away and back, or use the page refresh button |
| Mobile (Student) | Pull-to-refresh on Attendance / Timetable screen |
| Mobile (Teacher) | Pull-to-refresh on attendance list / timetable screen |
| Mobile (Parent) | Pull-to-refresh on child attendance / timetable screen |

No real-time websocket push is implemented. Data is always fresh on next API call.

---

## Cross-School Isolation

All API endpoints scope queries by `schoolId` derived from the authenticated user's  
JWT token via `getSchoolScope(req)`. This prevents data leakage between schools.

```typescript
const schoolId = getSchoolScope(req); // from JWT
where: { schoolId, ... }
```
