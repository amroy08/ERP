# Screen-By-Screen UI/UX Audit

This document provides a screen-by-screen audit of the mobile app, outlining current issues, architectural fixes, visual polish, and interaction recommendations.

---

## 📱 Detailed Screen Reviews

### 1. Login Screen
* **Current Purpose**: User authentication.
* **Primary User Goal**: Secure login to the appropriate portal.
* **The Current Issue**: Plain screen with basic email/password fields and role select radio buttons. Emojis serve as primary graphics, making the interface look dated.
* **The Architectural Fix**: Redesign the page layout. Place the school logo at the top and simplify the interface. Remove the role selection buttons; the app should automatically determine the user's role from their email and navigate accordingly.
* **The Visual Polish**: Add a smooth gradient background, subtle shadows, and a clean login form card with modern typography.
* **Interaction / Animation Recommendation**: Add smooth focus transitions on inputs and a loading spinner inside the login button.
* **Priority**: **P0**

---

### 2. Teacher Home Screen
* **Current Purpose**: Dashboard overview for teachers.
* **Primary User Goal**: Quick access to daily classes, pending attendance, and notices.
* **The Current Issue**: Basic layouts with flat cards. The dashboard is text-heavy and doesn't highlight daily priorities.
* **The Architectural Fix**: Group sections logically. Introduce a priority task list at the top (e.g., pending attendance alerts, homework waiting for review).
* **The Visual Polish**: Apply soft gradients to card widgets, style stats badges, and use consistent spacing.
* **Interaction / Animation Recommendation**: Add slide-in animations for dashboard cards on page load.
* **Priority**: **P1**

---

### 3. Teacher Timetable Screen
* **Current Purpose**: Display the teacher's weekly class schedule.
* **Primary User Goal**: Find where and when their next class is.
* **The Current Issue**: Plain vertical list of period slots. The day-tab buttons at the top are basic text rows.
* **The Architectural Fix**: Highlight the current class period with a visual countdown indicator.
* **The Visual Polish**: Color-code subjects, use bold period numbers, and add clear room/section badges.
* **Interaction / Animation Recommendation**: Add horizontal swipe gestures to easily switch between weekdays.
* **Priority**: **P1**

---

### 4. Teacher Attendance Screen
* **Current Purpose**: Mark student attendance.
* **Primary User Goal**: Quickly submit daily class attendance.
* **The Current Issue**: Toggling each student manually is slow for large classes. The layout is cramped, and there's no search option.
* **The Architectural Fix**: Add a "Mark All Present" button. Include a student search bar at the top of the roster.
* **The Visual Polish**: Style status buttons (Present/Absent/Late) with soft, color-coded backgrounds.
* **Interaction / Animation Recommendation**: Use a smooth haptic feedback effect when toggling attendance states.
* **Priority**: **P1**

---

### 5. Teacher Homework Screen
* **Current Purpose**: View and review homework assignments.
* **Primary User Goal**: Grade and provide feedback on student submissions.
* **The Current Issue**: Too many nested screens. Reviewing a single submission requires multiple taps and screen changes.
* **The Architectural Fix**: Implement a clean sliding bottom sheet or quick-review modal on the roster list to speed up grading.
* **The Visual Polish**: Use distinct status badges (e.g., Pending Review, Graded, Returned) and clear grading fields.
* **Interaction / Animation Recommendation**: Add simple swipe actions to quick-approve submissions.
* **Priority**: **P2**

---

### 6. Teacher Marks Screen
* **Current Purpose**: Record exam marks.
* **Primary User Goal**: Input student exam grades efficiently.
* **The Current Issue**: Tight list rows. Focus states during entry are weak, causing tap mistakes.
* **The Architectural Fix**: Highlight the active input row. Display the maximum marks limit clearly next to the input field.
* **The Visual Polish**: Modernize the input fields and structure the table cleanly.
* **Interaction / Animation Recommendation**: Keep the active input field visible when the system keyboard is open.
* **Priority**: **P2**

---

### 7. Teacher Notices Screen
* **Current Purpose**: View bulletins.
* **Primary User Goal**: Keep up with school announcements.
* **The Current Issue**: Standard list of notices. The notices cannot be expanded to view full text or attachments.
* **The Architectural Fix**: Add tap-to-expand details to notice cards. Include a download button for PDF attachments.
* **The Visual Polish**: Improve card layouts with clear title hierarchies, date tags, and priority labels.
* **Interaction / Animation Recommendation**: Use smooth spring animations when notice cards expand.
* **Priority**: **P2**

---

### 8. Student Home Screen
* **Current Purpose**: Student dashboard.
* **Primary User Goal**: See today's schedule, homework deadlines, and grades.
* **The Current Issue**: Flat dashboard cards that look like a menu. Emojis dominate the design.
* **The Architectural Fix**: Restructure the dashboard to focus on the student's daily agenda. Highlight the current class period, pending homework, and recent grades.
* **The Visual Polish**: Use custom icons instead of emojis. Add soft gradient accents to card widgets.
* **Interaction / Animation Recommendation**: Add slide-in animations for dashboard cards on page load.
* **Priority**: **P1**

---

### 9. Student Timetable Screen
* **Current Purpose**: View class schedule.
* **Primary User Goal**: See the weekly class timetable.
* **The Current Issue**: Plain text list of period slots. Day tabs are basic buttons.
* **The Architectural Fix**: Highlight the active class period on the schedule.
* **The Visual Polish**: Color-code subjects and use clean, modern typefaces.
* **Interaction / Animation Recommendation**: Add horizontal swipe gestures to switch between weekdays.
* **Priority**: **P1**

---

### 10. Student Homework Screen
* **Current Purpose**: View and submit assignments.
* **Primary User Goal**: Upload completed homework.
* **The Current Issue**: The submission page is plain and lacks clear status updates (e.g., Pending Review vs Graded).
* **The Architectural Fix**: Add visual preview cards for uploaded attachments. Provide clear success indicators upon submission.
* **The Visual Polish**: Modernize input text areas and status badges.
* **Interaction / Animation Recommendation**: Show a smooth progress bar during file uploads.
* **Priority**: **P1**

---

### 11. Student Exams Screen
* **Current Purpose**: View exam dates and results.
* **Primary User Goal**: Check test schedules and grades.
* **The Current Issue**: Flat text lists. Results lack context, such as class averages.
* **The Architectural Fix**: Add visual performance charts or class averages to help students gauge their progress.
* **The Visual Polish**: Style results cards with clean progress indicators and bold grades.
* **Interaction / Animation Recommendation**: Animate results bars when they load on screen.
* **Priority**: **P2**

---

### 12. Parent Home Screen
* **Current Purpose**: Parent dashboard.
* **Primary User Goal**: Monitor their child's academic progress and fees.
* **The Current Issue**: The dashboard is cluttered, and switching child profiles lacks clear visual feedback.
* **The Architectural Fix**: Add a persistent profile header showing the active child's name and photo across all tabs.
* **The Visual Polish**: Use soft gradients on widgets and clean status badges.
* **Interaction / Animation Recommendation**: Animate content transitions when switching child profiles.
* **Priority**: **P1**

---

### 13. Parent Attendance Screen
* **Current Purpose**: View child's attendance history.
* **Primary User Goal**: Check attendance compliance.
* **The Current Issue**: Attendance is displayed as a flat list, making it hard to spot absence trends.
* **The Architectural Fix**: Implement a month-view calendar with color-coded dates (green/red/orange).
* **The Visual Polish**: Use soft colors for calendar indicators and improve typography.
* **Interaction / Animation Recommendation**: Add month-to-month calendar transitions.
* **Priority**: **P1**

---

### 14. Parent Fees Screen
* **Current Purpose**: View school billing.
* **Primary User Goal**: Track and pay school fees.
* **The Current Issue**: Read-only ledger lists. It lacks call-to-action buttons for payments.
* **The Architectural Fix**: Add a prominent "Pay Now" button next to outstanding balances to support future payment integrations.
* **The Visual Polish**: Use clear billing structures, distinct status badges, and clean tables.
* **Interaction / Animation Recommendation**: Add expandable billing details cards.
* **Priority**: **P1**

---

### 15. Parent Notices Screen
* **Current Purpose**: View bulletins.
* **Primary User Goal**: Keep up with school notifications.
* **The Current Issue**: Simple text list notices. Cards cannot be expanded to view full attachments.
* **The Architectural Fix**: Implement tap-to-expand details and add download options for PDF files.
* **The Visual Polish**: Improve card layout, title typography, and priority badges.
* **Interaction / Animation Recommendation**: Use smooth spring animations when notice cards expand.
* **Priority**: **P2**
