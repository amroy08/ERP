# Teacher Homework Review Mobile Runtime Notes — Phase 3.1G

## Mobile Screen Flows

The mobile flow has been successfully wired to the backend APIs:

1. **Teacher Bottom Tab Navigator**:
   - Registered a new bottom navigation tab named `"Homework"` in [TeacherNavigator.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/navigation/TeacherNavigator.tsx) mapped to [TeacherHomeworkScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/teacher/TeacherHomeworkScreen.tsx).
   - Displayed with a clean notebook/book emoji `📚` using the signature light-ERP layout theme.

2. **Assigned Homework List**:
   - `getTeacherHomework` API handles loading teacher-assigned homework cards.
   - Shows due dates, class/section/subject metadata, and real-time statistics (total students, submitted count, pending count, reviewed count).
   - Offers pull-to-refresh capability to update counts immediately.

3. **Submissions Screen**:
   - Clicking `"Submissions"` navigates the teacher to the submissions detail panel [TeacherHomeworkSubmissionsView.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/teacher/components/TeacherHomeworkSubmissionsView.tsx).
   - Dynamically loads and filters the list of students by status tab: All, Pending, Submitted, Late, Reviewed, Returned.
   - Each row reveals student info, roll number/admission number, submission date, status badge, and indicators for whether text or files are attached.
