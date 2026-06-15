# Teacher Marks Validation Notes

To ensure database consistency and prevent bad payloads, `POST /api/mobile/teacher/marks/exams/:examId/save` performs the following validation steps:

1. **Payload Structure**:
   - `subjectId` (string) is required.
   - `maxMarks` (integer) is required, and must be $> 0$.
   - `marks` must be a non-empty array.

2. **Per-Student Score Validation**:
   - `studentId` must be valid.
   - `marksObtained` is required, and must parse to a non-negative integer ($\ge 0$).
   - `marksObtained` cannot exceed the specified `maxMarks`.

3. **Concurrency and Idempotency**:
   - Since the unique index `@@unique([examId, studentId, subjectId])` is defined in Prisma, we use `prisma.result.upsert()` within a transaction.
   - Any duplicate or subsequent saves for the same student, exam, and subject combination will cleanly update the existing record (updating `marksObtained`, `maxMarks`, `grade`, and `remark`) rather than inserting a duplicate row.
   - Grade calculations are dynamically computed on the backend using the standard scale:
     - $\ge 90\%$: `A+`
     - $\ge 80\%$: `A`
     - $\ge 70\%$: `B+`
     - $\ge 60\%$: `B`
     - $\ge 50\%$: `C`
     - $< 50\%$: `Needs Improvement`
