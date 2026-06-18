# Phase 3.3C: Login + Role-Based Dashboard Redesign Plan

This plan details the design enhancements to redesign the Teacher, Student, and Parent Home screens (dashboards) and polish the Login screen to integrate with the new Mobile Design System Foundation, keeping API and database schemas unchanged.

## User Review Required

> [!IMPORTANT]
> - This is a **design/planning phase** only. No codebase changes will be executed during planning.
> - Dashboard redesign is restricted strictly to the **Home/Dashboard screen** of each role. Inner screens (e.g. Attendance listing details, Timetables, Homework uploads, Marks tables) are intentionally left untouched.

## Proposed Scope

### 1. Login Screen Polish
- Polishing visual spacing parameters, input focus highlights, and quick access chips in [LoginScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/auth/LoginScreen.tsx).

### 2. Teacher Dashboard Redesign
- Upgrade [TeacherHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/teacher/TeacherHomeScreen.tsx) to display action cards ("Take Attendance", "Assign Homework", "Enter Marks"), timelines for today's classes, and curved hero greeting blocks.

### 3. Student Dashboard Redesign
- Upgrade [StudentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentHomeScreen.tsx) to feature daily timetable timelines, next active classes indicators, homework deadlines, and score banners.

### 4. Parent Dashboard Redesign
- Upgrade [ParentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentHomeScreen.tsx) with linked-children avatars context switchers, dues highlight badges, and status summary cards.

---

## Proposed Changes

### [MODIFY] [LoginScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/auth/LoginScreen.tsx)
- Spacing refinements.

### [MODIFY] [TeacherHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/teacher/TeacherHomeScreen.tsx)
- Upgrading layouts to consume design system tokens and quick action grid views.

### [MODIFY] [StudentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentHomeScreen.tsx)
- Redesigning dashboard widgets into card slots and next-class items.

### [MODIFY] [ParentHomeScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/parent/ParentHomeScreen.tsx)
- Introducing selected active student states and dashboard tabs.

---

## Verification Plan

### Automated Checks
- Run workspace compilation audits:
  ```bash
  cd mobile && npx tsc --noEmit
  ```

### Manual Verification
- Verify that standard navigation configurations, logins, and API refreshing cycles work smoothly without database errors.
