# Runtime Verification Notes: Mobile Notification UI

This document details the runtime verification strategy, database state, and environment used to validate the mobile notification UI.

## Environment Details
- **Frontend Platform**: React Native (compiled to Web via Expo Web at `http://localhost:8082`).
- **Backend API**: Node.js/Express listening on `http://localhost:5001`.
- **Database**: MySQL managed via Prisma Client.
- **Verification Tool**: Puppeteer automated script for mobile viewport rendering (375x812, touch enabled).

## Controlled Test Data Setup
To ensure realistic UAT screenshots containing notifications in different states (unread, read, empty), we executed the following backend scripts prior to UI capture:
1. **`scratch/create-test-notifications.ts`**:
   - Injected 3 unread notifications for Parent: child absence alert, fee reminder, notice.
   - Injected 3 unread notifications for Student: Mathematics homework, exam schedule, marks result.
   - Injected 2 unread notifications for Teacher: staff meeting notice, library circular.
2. **`scratch/test-logins.ts`**:
   - Verified active passwords in database: Teacher = `Teacher@123`, Student = `Student@123`, Parent = `Admin@123`.

## Interactive Verification Scenarios Covered
- **Teacher**:
  - Captured dashboard displaying badge count.
  - Tapped notification bell to load notifications list.
  - Tapped "Mark All as Read" to verify state transitions to read/empty.
- **Student**:
  - Captured dashboard displaying badge count.
  - Tapped notification bell to load notifications list.
  - Tapped a single homework notification ("New Homework: Mathematics") to verify that individual mark-read transitions correctly fade the item and decrement the badge.
- **Parent**:
  - Captured dashboard displaying badge count.
  - Tapped notification bell to load child notifications.
  - Tapped "Mark All as Read" to clear parent badge count.
