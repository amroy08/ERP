# Homework Submission Model Notes - Phase 3.1D

## Model Overview
The `HomeworkSubmission` model was created as it did not exist in the database.

## Model Schema
```prisma
model HomeworkSubmission {
  id               String   @id @default(cuid())
  homeworkId       String
  studentId        String
  schoolId         String?
  submittedAt      DateTime @default(now())
  status           String   @default("submitted")
  submissionText   String?  @db.Text
  fileName         String?
  filePath         String?
  mimeType         String?
  fileSize         Int?
  teacherFeedback  String?  @db.Text
  marks            Float?
  reviewedAt       DateTime?
  reviewedById     String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  homework         Homework @relation(fields: [homeworkId], references: [id], onDelete: Cascade)
  student          Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([homeworkId, studentId])
  @@index([schoolId])
  @@index([homeworkId])
  @@index([studentId])
  @@map("homework_submissions")
}
```

## Relationships
- Mapped as a standard one-to-many relation from both `Homework` and `Student` to `HomeworkSubmission`.
- Clean CASCADE onDelete ensures that deleting a homework assignment or student profile automatically cleans up associated homework submissions.
- Compound unique index `@@unique([homeworkId, studentId])` facilitates robust upsert-on-resubmission logic.
