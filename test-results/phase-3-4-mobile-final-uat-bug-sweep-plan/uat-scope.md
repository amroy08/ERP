# Mobile Final UAT Bug Sweep — Scope Definition

## Scope
The scope of the Phase 3.4 Mobile Final UAT Bug Sweep includes functional verification of:
1. **Authentication**: Form input fields, password toggles, and demo credentials on `LoginScreen`.
2. **Dashboards**: Greeting banners, metric metrics, preview lists, and navigation redirects across `TeacherHomeScreen`, `StudentHomeScreen`, and `ParentHomeScreen`.
3. **Teacher inner screens**:
   - `TeacherAttendanceScreen` (class lists and student marking toggles)
   - `TeacherTimetableScreen` (daily agendas)
   - `TeacherHomeworkScreen` (assignment lists and review details)
   - `TeacherMarksScreen` (exams selection and grades entry roster)
   - `TeacherNoticesScreen` (circular preview listings)
4. **Student inner screens**:
   - `StudentTimetableScreen` (daily agendas)
   - `StudentHomeworkScreen` (assignment listings, status tags, and submission modal triggers)
   - `HomeworkSubmissionModal` (text details, files attachment display)
   - `StudentExamsScreen` (exam lists and score progress bar cards)
5. **Parent inner screens**:
   - `ParentAttendanceScreen` (attendance rates and history timelines)
   - `ParentAcademicsScreen` (academics segmented tab sections: Timetable, Homework details, Exam timetables, Results scores)
   - `ParentFeesScreen` (outstanding balances and fee ledgers)
   - `ParentNoticesScreen` (collapsible notice list)
6. **Cross-Cutting Behaviors**:
   - Bottom navigation bars.
   - Access restriction guards.
   - Pull-to-refresh logic.
   - Empty/error/loading indicator layouts.
   - Modal views, focus triggers, and keyboard layouts.
