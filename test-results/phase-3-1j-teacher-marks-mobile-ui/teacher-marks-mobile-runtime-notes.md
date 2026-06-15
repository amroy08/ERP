# Phase 3.1J: Teacher Marks Mobile UI - Runtime Notes

## Mobile Flow Overview
The mobile teacher marks module implements a smooth state-based conditional sub-navigation inside a single bottom tab screen `TeacherMarksScreen.tsx`. This prevents any navigation parameter mismatches or transition lag, offering a cohesive, single-screen experience.

The flow operates as follows:
1. **Exam List View**: Loads all exams reachable by the logged-in teacher's assigned classes.
2. **Subject List View**: After clicking "Manage Marks →" on an exam, the screen transitions to list the reachable subjects for that exam.
3. **Student Marks Entry View**: Clicking "Enter Marks →" on a subject loads the student list grid, allowing inline marks input, remarks input, and dynamic max marks configuration.
4. **Save Marks**: Triggers bulk upsert on the backend, refreshes local counts, and updates the local state.

## State Management & Features
- **Loading States**: Full-screen activity indicators are displayed while loading exams, subjects, or student lists.
- **Empty States**: Described with high-quality emoji states when no exams, subjects, or students are assigned.
- **Error States & Retries**: Uses `ErrorState` components with a retry button to gracefully handle any temporary network errors.
- **Pull-To-Refresh**: Integrated via `RefreshControl` on the Exam List view to allow instant sync of updated schedules.
- **Keyboard-Aware Scrolling**: Wrapped inside `KeyboardAvoidingView` with a bottom padding buffer of `120px` to guarantee that text inputs do not get hidden behind the virtual keyboard.
- **Double Submit Prevention**: The save button shows a loading spinner and is disabled during requests to prevent double-submitting.

## API Integration Details
Reuses the secure, robust endpoints from Phase 3.1I:
- `GET /api/mobile/teacher/marks/exams` via `getTeacherMarksExams()`
- `GET /api/mobile/teacher/marks/exams/:examId/subjects` via `getTeacherMarksExamSubjects(examId)`
- `GET /api/mobile/teacher/marks/exams/:examId/students?subjectId=...` via `getTeacherMarksExamStudents(examId, subjectId)`
- `POST /api/mobile/teacher/marks/exams/:examId/save` via `saveTeacherMarks(examId, payload)`

## Emulator Setup & Verification Evidence
- **Device & OS**: Android Emulator (`emulator-5554`, Android SDK 34)
- **Screen Resolution**: 1080 x 2400 pixels (density: 440 dpi)
- **Screenshots Classification**: Real Android emulator runtime evidence (captured via ADB screencap and pulled to Workspace)
- **Teacher Marks Entry Flow**: PASS (Successfully fetched exams, subjects, and student list, input/saved marks)
- **Student Result Regression**: PASS (Updated marks are immediately visible in the student portal Exams/Results view)
- **Parent Result Regression**: PASS (Updated marks are immediately visible in parent Academics/Results view for their children, with zero cross-leak)
- **Validation Logic**: PASS (Negative and out-of-bounds inputs blocked on client-side; max marks <= 0 blocked)
- **No Console Errors / Red Screens**: Verified clean log outputs and crash-free navigation across all tabs.
