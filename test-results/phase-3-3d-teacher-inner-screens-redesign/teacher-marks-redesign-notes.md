# Teacher Marks Redesign Notes

## Changes Applied

### All 3 Levels
- `TeacherScreenHeader` on all 3 levels with back button and contextual subtitle.
- All back buttons use Ionicons `arrow-back` + text — no plain `Text "← Back"`.

### Exam List (Level 1)
- `MarksExamCard` component:
  - Exam name `typography.headingSmall fontWeight 800`
  - Class name badge (purple tint)
  - Exam date with Ionicons calendar
  - Status badge: `scheduled` → info, `completed` → success
  - Stats strip: Subjects / Students / Graded with `colors.surfaceSoft` background
  - Progress bar: thin track + teacher-colour fill representing `marksEnteredCount/totalStudents`
  - "N% marked" label + "Manage Marks →" with Ionicons chevron
- Pull-to-refresh on exam list.

### Subject List (Level 2)
- `MarksSubjectCard` component:
  - Subject name bold, Ionicons `document-text-outline` icon box
  - Section/class meta
  - Max marks badge
  - Stats: Students / Graded / Pending with dividers
  - Progress bar
  - "N% graded" + "Enter Marks →" with Ionicons chevron

### Student Marks Entry (Level 3)
- `TeacherScreenHeader` with back to Subjects.
- **Max Marks row**: label + `TextInput` styled with `colors.teacher` border — replaces the ad-hoc `maxMarksWrapper`.
- Student rows as `AppCard` with:
  - Avatar initials circle with Ionicons `person` icon
  - Name, roll, admission number
  - Existing grade in `colors.success`
  - Score `TextInput` (72px width) with error state: red border + `dangerSoft` background
  - Remarks `TextInput` (flex 1) in `colors.surfaceSoft`
- Sticky footer: Cancel `AppButton secondary` + Save Marks `AppButton gradient teacher` with Ionicons checkmark.
- `KeyboardAvoidingView` with `Platform.OS === 'ios' ? 'padding' : undefined` preserved.
- Student list content padding bottom 140 to clear sticky footer.

## Intentionally Not Changed
- All validation logic in `handleMarksChange`, `handleRemarksChange`, `handleMaxMarksChange` — preserved exactly.
- `handleSubmit` payload structure `{ subjectId, maxMarks, marks: [{ studentId, marksObtained, remarks }] }` — unchanged.
- `loadExams`, `loadSubjects`, `loadStudents` navigation state machine — unchanged.
- All API calls — unchanged.
- `selectedExam`, `selectedSubject` state variables — unchanged.

## Bugs Fixed
- `className` on `TeacherMarksExam` is `string | undefined` — used `?? ''` coalescing.
- `examDate` on `TeacherMarksExam` is `string | null | undefined` — used `?? undefined` coalescing.
- `sectionName` on `TeacherMarksSubject` is `string | null | undefined` — used `?? undefined` coalescing.

## Validation Result
- Exam list renders with progress bars and status badges.
- Exam → Subject navigation works.
- Subject → Student entry navigation works with pre-filled marks.
- Inline validation shows errors for out-of-range inputs.
- Max Marks change re-validates all student entries.
- Save sends correct payload.
- Sticky footer visible and does not clip content.
- Back navigation at each level works correctly.
