# Student Role UX Audit

This document reviews the specific user experience (UX) flows and feature access patterns tailored for the Student role on the mobile application.

---

## 🔍 Core UX Audits

### 1. Dashboard Usability
* **Audit**: Students see summaries of daily classes, pending homework, active notices, and a progress percentage ring.
* **Findings**: The home dashboard looks like a standard menu rather than an active academic feed. Emojis and flat cards dominate.
* **UX Opportunity**: Transform the home dashboard into a personalized daily agenda. Highlight the very next class, upcoming homework due today, and recent exam results.

### 2. Timetable & Daily Schedule
* **Audit**: Displays a vertical list of periods.
* **Findings**: Clean, but fails to show visual cues like subject-specific colors or teacher photos.
* **UX Opportunity**: Color-code subjects (e.g., green for science, blue for math) to make the schedule scannable at a glance.

### 3. Homework Upload & Submissions
* **Audit**: Students view assignments list, open detail pages, and can write short text answers or attach single documents.
* **Findings**: The submission form is simple, but lacks visual confirmation. There is no clear success feedback once submitted, leaving students unsure if their upload succeeded.
* **UX Opportunity**: Implement a clear success confirmation state with status badges (e.g., "Successfully Uploaded"). Show preview cards of attached files.

### 4. Exams & Results Dashboard
* **Audit**: Lists exam schedules and reports cards.
* **Findings**: Results list scores as raw text rows. It lacks context, like class averages, to help students understand their performance.
* **UX Opportunity**: Integrate small visual indicators (charts or class averages) to provide context for exam marks.
