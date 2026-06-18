# Phase 3.2G Notices Parity Notes

## Notice targeting and Audience filtering
Notices are created in the Web console by Admin/Principal/Clerk roles. When creating a notice, the creator selects target roles (e.g. `all`, `teacher`, `parent`, `student`).
- **Database Model**: `Notice` schema stores target audience in the `targetRoles` string field (comma-separated values).
- **Backend Filters**:
  - **Parents**: Retrieves notices where `targetRoles` contains `'all'` or `'parent'`.
  - **Teachers**: Retrieves notices where `targetRoles` contains `'all'` or `'teacher'`.
  - **Students**: Retrieves notices where `targetRoles` contains `'all'` or `'student'`.

---

## Notices Visibility Across Mobile Roles

### 1. Parent Notice Visibility
- **UI Screen**: `ParentNoticesScreen` accessible via the bottom tab navigation.
- **Features**: Tap card to expand the notice content or view the date. Supports full list pull-to-refresh.
- **Sync Status**: Matches live Web console notice updates immediately.

### 2. Teacher Notice Visibility
- **UI Screen**: `TeacherNoticesScreen` (registered in the `TeacherNavigator` tab navigation) and recent notices feed on the `TeacherHomeScreen`.
- **Features**: Dashboard widget shows recent notices summary. Notices screen provides full tap-to-expand content.
- **Sync Status**: Matches live Web console notice updates immediately.

### 3. Student Notice Visibility
- **UI Screen**: Dashboard recent notices widget on the `StudentHomeScreen`.
- **Features**: Lists the title, priority, and date of the top 5 notices targeting students.
- **Sync Status**: Reflects published notices immediately on dashboard reload.
- **Limitations**: No dedicated notices tab/screen is implemented for students. Notices appear on the dashboard only.

---

## Class and Section targeting
- **Current Database Schema Constraint**: The `Notice` model does not contain fields linking notices to specific classes or sections. Targeting is strictly role-based (`targetRoles`).
- **Audit Finding**: Class/Section notice isolation is not supported by the system. All notices published to a role are distributed to all members of that role across the school.
