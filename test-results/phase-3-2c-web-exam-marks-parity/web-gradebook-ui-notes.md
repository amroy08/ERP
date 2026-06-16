# Phase 3.2C: Web Gradebook UI Notes

## User Interface Elements
The Web Console's `ExamsPage.tsx` was verified to fully support Gradebook view, enriched subject list, and inline editing workflows:
- **Scheduled Exams**: Shows exam metadata, start/end dates, class scoping, and quick action buttons (Gradebook, Record Marks, Edit, Delete).
- **Gradebook Summary**: Shows counts of Total Students, Subjects, Marks Entered, and Pending assessments. A grid lists subjects along with teacher name, progress bar (percentage of completion), and average score.
- **Marks Register Table**: Supports inline edit, percentage calculation, automatic grade calculation, feedback input, and instant database save.
- **Bulk Marks Entry Mode**: Allows quick grid-based recording of marks for entire classes in sequential fashion.
