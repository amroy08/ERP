# Web Console UI Plan - Phase 4.1

This document describes the design and components of the Web Admin Notification management system.

---

## 1. Notification Settings Panel

A new settings section, **Notification Rules**, will be integrated within the Admin dashboard settings workspace:

### UI Wireframe Layout
* **Global Enabler**: Toggle switch to pause all outgoing push/email alerts during school holidays or maintenance.
* **Fee Reminder Rules**:
  * **Enable reminders**: Switch toggle.
  * **Cooldown interval**: Dropdown or number input selector (`3 days`, `7 days`, `14 days`).
  * **Overdue trigger offset**: Number input selector for days past due date to trigger the first alert (default: `1 day`).
* **Absence Alert Rules**:
  * **Enable alerts**: Switch toggle.
  * **Threshold count**: Number input selector (default: `3 absences`).
  * **Threshold range**: Number input selector for days window (default: `7 days`).
  * **Alert cooldown**: Number input selector for days before repeating alert (default: `2 days`).

### Component Design
* Built using existing web console styling parameters (vibrant HSL colors, premium cards, dark-mode compatibility).
* Incorporates inline save/submit action status (success toast alerts).

---

## 2. Notification Audit Logs View

A read-only tabular interface for school admins to monitor and audit dispatch logs.

### Columns
* **Recipient**: Name & role of the user (with clickable link to user profile).
* **Alert Type**: Badge representing notification type (e.g. `HOMEWORK_POSTED`, `FEES_OVERDUE`).
* **Channels**: Icons for delivery status (Email, Push, In-App) with coloring:
  * Green check: Sent successfully.
  * Red warning: Failed (hovering displays error message, e.g., "SMTP connection timeout").
  * Grey slash: Skipped (e.g. invalid email address).
* **Sent Date**: Normalized timestamp.
* **Metadata**: Expandable row showing details (e.g., student name, associated fee invoice ID).

---

## 3. Manual Broadcast Form (Future Expansion)

An optional feature allowing admins to broadcast custom notifications immediately:
* **Target Role Selection**: Checkboxes for super_admin, admin, teacher, clerk, parent, student.
* **Title & Body fields**: Simple markdown text inputs.
* **Priority Switch**: Low, Normal, High.
* **Immediate Delivery**: Dispatch triggers instant push and email dispatches to selected groups.
