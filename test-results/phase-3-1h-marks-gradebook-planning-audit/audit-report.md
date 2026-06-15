# Phase 3.1H: Marks / Gradebook Planning Audit Report

This report outlines the technical analysis, schema audit, authorization strategy, and implementation plan for the **Teacher Marks Entry** feature.

---

## 1. Current Exam & Result Data Model Analysis

The data models for exams and marks/results are defined in `server/prisma/schema.prisma`. 

### `Exam` Model
```prisma
model Exam {
  id             String       @id @default(uuid())
  name           String
  type           String
  classId        String
  academicYearId String
  startDate      DateTime
  endDate        DateTime
  status         String       @default("scheduled")
  description    String?      @db.Text
  fileUrl        String?
  schoolId       String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  academicYear   AcademicYear @relation(fields: [academicYearId], references: [id])
  class          Class        @relation(fields: [classId], references: [id])
  school         School?      @relation(fields: [schoolId], references: [id])
  results        Result[]
}
```

### `Result` Model (Stores Marks)
```prisma
model Result {
  id            String   @id @default(uuid())
  examId        String
  studentId     String
  subjectId     String
  marksObtained Int
  maxMarks      Int
  grade         String?
  remark        String?
  schoolId      String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  exam          Exam     @relation(fields: [examId], references: [id])
  school        School?  @relation(fields: [schoolId], references: [id])
  student       Student  @relation(fields: [studentId], references: [id])
  subject       Subject  @relation(fields: [subjectId], references: [id])

  @@unique([examId, studentId, subjectId])
}
```

### Key Insights:
1. **No Separate Marks Model**: The `Result` model serves as the actual container for marks per student, per subject, per exam. No new `Marks` model is required.
2. **Missing `Exam.sectionId`**: The `Exam` model defines a `classId` but has no relationship with a `Section`. Results, however, are mapped to individual students, who are linked to a section (`Student.sectionId`).
3. **No `Result.published`**: There is no publish flag. Marks entered are immediately visible to students and parents under their respective dashboards.
4. **Unique Constraint**: The `@@unique([examId, studentId, subjectId])` constraint ensures a student has exactly one marks entry per subject per exam, which enables safe upserts.

---

## 2. Teacher Assignment Mapping

To determine which exams, subjects, and students a teacher can enter marks for, we traverse the following relations starting from the logged-in `Teacher`:

1. **Active Teacher Scope**:
   A teacher is assigned to specific sections and subjects via the `SubjectTeacher` model:
   - `SubjectTeacher.teacherId == teacher.id`
   - `SubjectTeacher.status == "active"`
   - `SubjectTeacher.sectionId` (links to a `Section` which has a `classId`)
   - `SubjectTeacher.subjectId` (links to a `Subject`)

2. **Exam Mapping (Reachable Exams)**:
   Since `Exam` only has a `classId`, an exam is reachable by a teacher if:
   - The teacher is assigned to teach any subject in a section belonging to `exam.classId` (i.e. `st.section.classId == exam.classId`).
   - OR the teacher is explicitly assigned to the class (via `Teacher.assignedClasses` class mapping).

3. **Student Mapping (Class/Section Scope)**:
   When entering marks for a subject, the teacher should only see and enter marks for students belonging to sections where the teacher is assigned to teach that subject (i.e. `Student.sectionId == SubjectTeacher.sectionId`).

---

## 3. Schema Gap Analysis & Actionability

- **Exam.sectionId**: Missing. However, this is an architectural choice. Exams are school-wide/class-wide events. Marks entry, however, is section-specific. The teacher's section assignments (`SubjectTeacher`) filter the list of students they see.
- **Result.published**: Missing. This is not blocking basic marks entry since results are retrieved directly.
- **Conclusion**: **No schema changes or Prisma migrations are needed.** The existing database models are fully sufficient to build the teacher marks entry workflow.

---

## 4. API Gap Analysis

### Existing Web Admin Endpoints:
- `POST /api/exams/submit-results`: Bulk uploads results.

### Unregistered/Broken Web API Routes (Pre-existing in codebase):
- `GET /api/exams/subjects/:examId` (Controller exists but not registered in router).
- `GET /api/exams/marks/:eId/:sId` (Controller exists but not registered in router).
- `POST /api/exams/marks` (Client web app tries to call this, but it doesn't exist).
*Note: These are pre-existing issues in the web admin codebase and do not block the mobile application implementation.*

### Missing Mobile Teacher Endpoints (to be added in Phase 3.1I):
1. `GET /api/mobile/teacher/marks/exams`: Lists exams relevant to the teacher's classes.
2. `GET /api/mobile/teacher/marks/exams/:examId/subjects`: Lists subjects assigned to the teacher for the exam's class.
3. `GET /api/mobile/teacher/marks/exams/:examId/students?subjectId=...`: Lists students in the teacher's sections with their current marks (if any).
4. `POST /api/mobile/teacher/marks/exams/:examId/save`: Saves or updates marks in bulk for the selected exam, subject, and students.

---

## 5. Teacher Marks Authorization Strategy

To prevent unauthorized access or modification, every mobile teacher marks endpoint will enforce strict checking via a shared authorization utility `getTeacherMarksScopeOrThrow`:

```typescript
async function getTeacherMarksScopeOrThrow(
  authUserId: string,
  examId: string,
  subjectId?: string
) {
  // 1. Fetch teacher profile
  const teacher = await prisma.teacher.findUnique({
    where: { userId: authUserId },
    include: {
      subjectTeachers: {
        where: { status: 'active' },
        include: { section: true }
      },
      assignedClasses: true
    }
  });
  if (!teacher) throw new UnauthorizedError('Not a teacher profile');

  // 2. Fetch exam details
  const exam = await prisma.exam.findUnique({
    where: { id: examId }
  });
  if (!exam) throw new NotFoundError('Exam not found');
  if (exam.schoolId !== teacher.schoolId) {
    throw new ForbiddenError('Unauthorized: Different school context');
  }

  // 3. Verify Class Authorization
  const hasClassAccess = 
    teacher.assignedClasses.some(c => c.id === exam.classId) ||
    teacher.subjectTeachers.some(st => st.section.classId === exam.classId);
  
  if (!hasClassAccess) {
    throw new ForbiddenError('Unauthorized: Teacher does not teach in this exam\'s class');
  }

  // 4. Verify Subject Authorization (if subjectId is provided)
  if (subjectId) {
    const hasSubjectAccess = teacher.subjectTeachers.some(st => 
      st.subjectId === subjectId && st.section.classId === exam.classId
    );
    if (!hasSubjectAccess) {
      throw new ForbiddenError('Unauthorized: Teacher is not assigned to this subject in this class');
    }
  }

  return { teacher, exam };
}
```

---

## 6. Proposed Implementation Phases

### Phase 3.1I: Backend API Implementation
1. Register and implement the 4 mobile endpoints under `/api/mobile/teacher/marks`.
2. Reuse `ExamService.submitResults` or write an optimized bulk upsert handler to match validation schemas.
3. Write rigorous automated integration test scripts to verify auth scopes, success paths, and validation checks.

### Phase 3.2: Mobile UI Implementation
1. Add "Marks Entry" to the Teacher homepage quick actions / dashboard.
2. Build `TeacherMarksExamsScreen`: lists exams with status.
3. Build `TeacherMarksSubjectsScreen`: lists subjects for the selected exam.
4. Build `TeacherMarksEntryScreen`: table/list of students in the teacher's sections. Inputs for Marks Obtained and Remarks, with input validation (marks must be $\le$ max marks).
5. Add loading states, success toast indicators, and verification of student/parent visibility updates.
