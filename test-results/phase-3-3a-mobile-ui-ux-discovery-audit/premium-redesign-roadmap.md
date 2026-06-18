# Premium Redesign Roadmap

This roadmap defines the step-by-step phases for transitioning the current mobile app into a modern, polished School ERP mobile application.

---

## 🗺️ Implementation Phases

### 🎨 Phase 3.3B: Mobile Design System Foundation
* **Scope**: Build the core design tokens, color palette, typography scales, spacing tokens, elevations, and shadows.
* **Included Components**:
  * `mobile/src/theme/` (colors, spacing, and typography structures).
  * Refined base components: `AppButton`, `AppCard`, `AppInput`, and `StatusBadge`.
  * Customized skeletons and loading placeholders.
* **Risk Level**: **Medium** (Core component updates affect all screens; requires thorough regression testing).
* **Expected Files**:
  * `mobile/src/theme/theme.ts` [NEW] or similar config files.
  * Modifying components under `mobile/src/components/*`.
* **Do Not Touch Areas**: Navigation configurations, API calls, and business logic.
* **Validation Checks**: Verify successful compilation via `npx tsc --noEmit`.

---

### 🔑 Phase 3.3C: Login & Role-Based Dashboard Redesign
* **Scope**: Redesign the LoginPage and role-specific home dashboards for Teachers, Students, and Parents.
* **Included Screens**:
  * Login Screen (no manual role selectors, clean form cards).
  * Teacher Home Dashboard (daily action items widget, quick stats cards).
  * Student Home Dashboard (academic agenda feed, attendance summary ring).
  * Parent Home Dashboard (improved sibling switcher, active student profile card).
* **Risk Level**: **Medium**
* **Expected Files**:
  * `mobile/src/screens/auth/LoginScreen.tsx`
  * `mobile/src/screens/teacher/TeacherHomeScreen.tsx`
  * `mobile/src/screens/student/StudentHomeScreen.tsx`
  * `mobile/src/screens/parent/ParentHomeScreen.tsx`
* **Do Not Touch Areas**: Redux store actions, push notifications registration handlers, and API client configs.
* **Validation Checks**: Mobile TypeScript compilation checks.

---

### 👩‍🏫 Phase 3.3D: Teacher Screens Premium Redesign
* **Scope**: Redesign all core screens supporting the Teacher workflow.
* **Included Screens**:
  * Teacher Timetable Screen (weekday swipe navigation, active slot tracking).
  * Teacher Attendance Screen ("Mark All Present" fast button, search filter).
  * Teacher Homework Screen (streamlined roster lists, inline feedback inputs).
  * Teacher Marks Screen (table layout improvements, input focus tracking).
  * Teacher Notices Screen (bulletins cards detail views, file attachments).
* **Risk Level**: **Low** (Mainly UI/UX polish).
* **Expected Files**:
  * `mobile/src/screens/teacher/*` (Timetable, Attendance, Homework, Marks, Notices).
* **Do Not Touch Areas**: Teacher controller handlers and database query structures.
* **Validation Checks**: Mobile compile tests.

---

### 👨‍🎓 Phase 3.3E: Student Screens Premium Redesign
* **Scope**: Redesign all student-specific dashboard feeds.
* **Included Screens**:
  * Student Timetable Screen (weekday swipe actions, class room highlights).
  * Student Homework Screen (status tags, upload preview cards, success screens).
  * Student Exams & Results Screen (marks card tables, progress indicators).
* **Risk Level**: **Low**
* **Expected Files**:
  * `mobile/src/screens/student/*` (Timetable, Homework, Exams).
* **Do Not Touch Areas**: File upload middlewares, homework submission API routes.
* **Validation Checks**: Mobile typechecks.

---

### 👥 Phase 3.3F: Parent Screens Premium Redesign
* **Scope**: Redesign all parent-specific dashboards.
* **Included Screens**:
  * Parent Sibling Attendance Screen (month-grid calendar visualization).
  * Parent Academics Screen (consolidated sibling academic status tabs).
  * Parent Fees Screen (billing logs, clear payment triggers).
  * Parent Notices Screen (expanded notices cards, download files).
* **Risk Level**: **Low**
* **Expected Files**:
  * `mobile/src/screens/parent/*` (Attendance, Academics, Fees, Notices).
* **Do Not Touch Areas**: Database transaction records, billing calculations logic.
* **Validation Checks**: Mobile compile tests.

---

### 🔍 Phase 3.3G: Mobile UI Runtime Audit
* **Scope**: Full verification audit of the redesigned mobile app.
* **Included Screens**: All mobile screens.
* **Risk Level**: **Low**
* **Expected Files**:
  * `test-results/phase-3-3g-mobile-ui-runtime-audit/` (detailed audit files, screenshots, walkthroughs).
* **Do Not Touch Areas**: All production source files.
* **Validation Checks**: End-to-end user navigation checks, full server/client/mobile compiles, automated test suite executions.
