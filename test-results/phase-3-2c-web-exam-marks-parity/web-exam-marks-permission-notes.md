# Phase 3.2C: Web Exam Marks Permission Notes

## Permission Scoping Matrix
- **Super Admin / Admin**: Full school-wide access (`PERMISSIONS.EXAM_VIEW` and `PERMISSIONS.EXAM_CREATE`). Can schedule exams, view any class gradebook, and edit marks for all subjects.
- **Teacher**: Scoped access. Can view class gradebooks where they teach and view/edit marks only for their assigned subjects (`PERMISSIONS.EXAM_MARKS_ENTRY` and `PERMISSIONS.EXAM_VIEW`). They must be assigned to the subject in `Subject.teacherId` or `SubjectTeacher.teacherId`.
- **Staff**: Permission-based. Follows generic `PERMISSIONS.EXAM_VIEW` and `EXAM_MARKS_ENTRY` flags mapped in settings.
- **Student**: Read-only access (`PERMISSIONS.EXAM_VIEW`). Restricted via row-level checks to only view results matching their own student record.
- **Parent**: Read-only access. Restricted via row-level checks to only view results matching their linked children.
