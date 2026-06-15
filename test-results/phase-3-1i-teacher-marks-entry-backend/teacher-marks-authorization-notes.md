# Teacher Marks Entry Authorization Notes

Security checks are managed through the centralized helper function `getTeacherMarksScopeOrThrow(authUser, examId, subjectId?)`.

## Authorization Checks performed:

1. **Role Enforcement**: Rejects any user who does not have the `'teacher'` role (returns `403 Forbidden`).
2. **Profile Verification**: Verifies the teacher profile exists in the database.
3. **School Context Scoping**: Verifies the requested exam belongs to the same school as the teacher (`exam.schoolId === teacher.schoolId`), preventing multi-tenant data leaks.
4. **Reachable Class Check**: Computes all class IDs reachable by the teacher through four assignment sources:
   - Sections where the teacher is an active subject teacher (`SubjectTeacher` table).
   - Classes where the teacher is directly assigned (`assignedClasses` relation).
   - Sections where the teacher is a class teacher (`classTeacherOf` relation).
   - Subjects directly assigned to the teacher (`Subject.teacherId === teacher.id`).
   - Timetable entries matching the teacher and class.
   If the exam's `classId` is not reachable via any of these sources, access is denied (`403 Forbidden`).
5. **Subject Scoping**: If `subjectId` is provided, verifies that the teacher is authorized to mark this subject within the exam's class (using active `SubjectTeacher` records, direct subject assignments, or timetable schedules). If not, access is denied (`403 Forbidden`).
6. **Student Scope Verification**: In `POST /save`, it ensures all student IDs in the payload belong to sections that are within the teacher's authorized marking scope.
