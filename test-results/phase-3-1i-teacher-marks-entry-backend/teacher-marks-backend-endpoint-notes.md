# Teacher Marks Entry Backend Endpoint Notes

In Phase 3.1I, we added four REST API routes under the protected `/api/mobile` context:

1. **`GET /api/mobile/teacher/marks/exams`**
   - **Description**: Returns all exams that are within the teacher's reachable class/section/subject scope.
   - **Response Details**: Includes `examId`, `examName`, `classId`, `className`, `sectionId`, `sectionName`, `examDate`, `status`, `totalSubjects`, `marksEnteredCount`, `totalStudents`, and `publishedStatus`.

2. **`GET /api/mobile/teacher/marks/exams/:examId/subjects`**
   - **Description**: Lists subjects taught by the logged-in teacher in the selected exam's class.
   - **Response Details**: Includes `subjectId`, `subjectName`, `className`, `sectionName`, `maxMarks`, `marksEnteredCount`, and `totalStudents`.

3. **`GET /api/mobile/teacher/marks/exams/:examId/students?subjectId=...`**
   - **Description**: Lists students in the sections taught by the teacher for the selected subject, including roll numbers, admission numbers, and existing marks/remarks from the `Result` model.
   - **Response Details**: Includes `studentId`, `studentName`, `rollNo`, `admissionNo`, `existingResultId`, `marksObtained`, `grade`, `remarks`, and `status` ('entered' or 'pending').

4. **`POST /api/mobile/teacher/marks/exams/:examId/save`**
   - **Description**: Bulk inserts/updates student marks for a given exam and subject.
   - **Request Body**:
     ```json
     {
       "subjectId": "subject-uuid",
       "maxMarks": 100,
       "marks": [
         {
           "studentId": "student-uuid",
           "marksObtained": 85,
           "remarks": "Excellent work!"
         }
       ]
     }
     ```
   - **Response Details**: Returns `success: true`, `savedCount`, `createdCount`, `updatedCount`, and `message`.
