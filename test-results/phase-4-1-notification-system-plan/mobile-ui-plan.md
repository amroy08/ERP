# Mobile UI Plan - Phase 4.1

This document specifies the design, layout, and behaviors of the notification features in the School ERP mobile app.

---

## 1. UI Components & Screens

### A. Notification Bell in Header
* **Location**: Right-aligned in the navigation header bar across all home dashboards:
  * [ParentScreenHeader](file:///Users/amroy/Desktop/ERP/mobile/src/components/parent/ParentScreenHeader.tsx)
  * [StudentScreenHeader](file:///Users/amroy/Desktop/ERP/mobile/src/components/student/StudentScreenHeader.tsx)
  * [TeacherScreenHeader](file:///Users/amroy/Desktop/ERP/mobile/src/components/teacher/TeacherScreenHeader.tsx)
* **Design**: An `Ionicons` bell outline (e.g., `notifications-outline`). If unread count $> 0$, render a small solid red circle badge containing the count on the top-right quadrant of the bell icon.

### B. Notification List Screen (`NotificationListScreen.tsx`)
A new screen accessible by clicking the notification bell.
* **Header Actions**:
  * "Mark all as read" button on top right of header.
* **Layout**: A flat scrollable list displaying alerts sorted chronologically (latest first).
* **Card Design**:
  * Unread notifications feature a subtle tinted background color (e.g., brand-color light alpha opacity) and a colored left border matching the alert priority:
    * `URGENT` / `HIGH`: Red border.
    * `NORMAL`: Blue border.
    * `LOW`: Grey border.
  * Icon placeholder displaying the alert type (e.g., book icon for homework, calendar icon for exams, card icon for fees).
  * Time metadata (e.g., "2 hours ago", "Yesterday").
* **Interactions**:
  * **Swipe to Read**: Swiping left on a card triggers a PATCH call to mark it as read.
  * **Pull-to-Refresh**: Triggers a fetch to reload the notification array.
  * **Tap to Navigate**: Tapping a notification marks it as read and navigates the user to the corresponding entity screen (e.g., tapping a homework notification opens the Homework detail view).
* **States**:
  * **Loading State**: Render skeletal cards with shimmering placeholders.
  * **Empty State**: Render a clean custom illustration stating "You're all caught up! No new notifications."
  * **Error State**: Render an error warning card with a "Retry" button.

---

## 2. Role-Specific Notification Displays

The UI filters notifications matching the active user role constraints:

### A. Parent App
* Displays alerts linked to their child or school notices:
  * **Homework Assigned**: "Math Homework assigned to student Arjun. Due: June 25."
  * **Exam Scheduled**: "Final Exams scheduled for Class 10."
  * **Marks Published**: "Arjun's results for Science Exam are available: 85/100."
  * **Attendance Alerts**: "Arjun was marked absent on June 18."
  * **Fee Alerts**: "Fee installment of ₹5,000 is overdue by 5 days."
  * **Notices**: General school-wide notices.

### B. Student App
* Displays academic alerts:
  * **Homework Assigned**: "New homework assigned in English. Due: June 25."
  * **Exam Scheduled**: "Your Class 10 term exam date-sheet has been published."
  * **Marks Published**: "Your marks for Science Exam are available: 90/100."
  * **Notices**: Announcements targeted to the student body.

### C. Teacher App
* Displays professional/administrative updates:
  * **Notices**: Teacher/staff notices (e.g., staff meetings, school policy updates).
  * **Submissions Alerts** (Optional): "Student Arjun submitted homework 'Physics Assignment'."
