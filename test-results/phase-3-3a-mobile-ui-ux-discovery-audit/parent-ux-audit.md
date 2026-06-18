# Parent Role UX Audit

This document reviews the specific parent user experience (UX) flows, multi-child switcher, and payment/notices dashboards on the mobile app.

---

## 🔍 Core UX Audits

### 1. Sibling Profile Switcher
* **Audit**: Parent Home Screen displays profile selector context cards for switching siblings.
* **Findings**: The switcher works but uses basic button styling. Tapping it changes the active child context, but the app lacks clear visual feedback to confirm which child's data is currently displayed on sub-screens.
* **UX Opportunity**: Implement a permanent top bar avatar badge displaying the active child's name and photo across all tabs, ensuring parents always know which child they are viewing.

### 2. Sibling Attendance visualizer
* **Audit**: Displays monthly attendance percentages with present/absent logs list.
* **Findings**: The calendar uses flat text lists, making it hard to spot trends like consecutive absences.
* **UX Opportunity**: Implement a calendar view with color-coded dates (green/red/orange) to help parents scan monthly attendance at a glance.

### 3. Academics (Homework, Timetables, Exams, Results)
* **Audit**: A tabbed screen consolidating child academic schedules, homework lists, and report cards.
* **Findings**: Clean, but the lists are flat and hard to navigate. High-priority items like upcoming exams or missing homework don't stand out.
* **UX Opportunity**: Add quick-filters (e.g. "Overdue", "Grades") and highlight high-priority academic events at the top of the feed.

### 4. Fee Ledger Tracking
* **Audit**: Displays outstanding structures, amounts paid, amounts due, and payment status badges.
* **Findings**: Clean ledger, but is read-only. It lacks payment call-to-actions, forcing parents to use external web portals.
* **UX Opportunity**: Add prominent "Pay Now" action triggers next to outstanding balances to prepare for online payments integration.
