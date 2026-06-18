# Parent Academics Redesign Notes

## Changes Applied
- Replaced the basic screens with a single integrated Academics screen using `ParentScreenHeader` and child context banner headers (`ChildContextHeader`).
- Built a premium rounded segmented control tab selector for the four academic dimensions.
- **Timetable Tab**:
  - Displays weekday agenda lists via custom horizontal weekday switcher pills.
  - Reuses the `TodayScheduleCard` layout to show time slot details, period numbers, subjects, and teachers.
- **Homework Tab**:
  - Includes a warning highlight indicator bar for pending homework count.
  - Provides quick-filtering pills (All, Pending, Submitted) to organize assignments.
  - Displays due date, title, marks, and detailed expanded view boxes with description and teacher feedback parameters.
- **Exams Tab**:
  - Highlights upcoming exam subjects, start times, and total marks on structured agenda cards.
  - Adds status badge date boxes showing day, month, and color-coded countdown indicators for imminent deadlines.
- **Results Tab**:
  - Visualizes test score cards displaying final marks.
  - Shows custom color-coded percentage status indicators and grade badges alongside completion progress bars.

## Intentionally Left Unchanged
- Fetching APIs for academic records (`getParentChildTimetable`, `getParentChildHomework`, `getParentChildExams`, `getParentChildResults`).
- Parent-child visibility scopes.
