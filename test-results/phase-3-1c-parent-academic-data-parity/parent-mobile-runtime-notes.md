# Parent Mobile Runtime Verification Notes (Phase 3.1C)

This document contains runtime notes verifying the visual layouts and child switching interactions on the mobile app using parent accounts.

---

## 1. Authentication and Home Verification
* **Login Account**: `parent@school.com` / `Admin@123`
* **Home Dashboard Layout**:
  - Greeting displays: "Good day, Parent Name".
  - "My Children" list displays child card for **Jane Doe** (Class 1 - A).
  - Child card displays academic indicators:
    * 📅  `1 periods today`
    * 📚  `2 pending` (homework)
    * 📊  `78% in Mathematics (First Term Examination)` (latest result/marks summary).

---

## 2. Academics Screen Verification
* **Bottom Navigator**:
  - The bottom bar now contains: **Home** 🏠, **Attendance** 📅, **Academics** 📚, **Fees** ₹, and **Notices** 📢.
* **Child Switcher**:
  - When more than one child is active, horizontal switcher pills display at the top (e.g. `👶  Child1`, `👶  Child2`).
  - Toggling children dynamically refetches and updates all academic child cards.
* **Segmented Sub-Tabs**:
  - **Timetable**: Day tabs are rendered at the top (Mon, Wed, Fri). Selecting a day shows cards with times, subject names (e.g., Mathematics), and the assigned teacher name.
  - **Homework**: Displays filters (All, Pending, Submitted) and lists assignments. Clicking a homework card expands its description preview.
  - **Exams**: Displays scheduled exams with dates, total marks, and countdown alerts (e.g. `2d left`).
  - **Results**: Displays score progress bars and grades corresponding to published exam results (Quiz: 84%, Midterm: 78%).

---

## 3. Stability Checks
* **Errors & Red Screens**: None.
* **Console Warnings**: None.
* **Theme consistency**: Light theme, matching primary blue colors (`colors.parent = '#2563EB'`).
