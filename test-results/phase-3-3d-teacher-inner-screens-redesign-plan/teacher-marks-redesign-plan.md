# Teacher Marks Screen – Redesign Plan

## Screen Name
`TeacherMarksScreen.tsx`

## Current Purpose
3-level navigation flow for entering student exam marks:
1. **Exam List** — shows all exams assigned to teacher with date, class, subjects count, marks entered count, status badge.
2. **Subject List** — shows subjects for a selected exam with graded/total student counts.
3. **Student Marks Entry** — FlatList of students, each with a score input and optional remarks input. Sticky footer with Cancel/Save Marks buttons.

## Primary Teacher Goal
Enter marks for all students in a subject efficiently, validate inputs inline, and submit.

## Current UI Issues
1. All three views use raw `fontSize: 24, fontWeight: '800'` — no typography tokens.
2. Back buttons are plain `TouchableOpacity` + `Text "← Back to..."` — no Ionicons.
3. Exam status badge uses `StatusBadge` correctly but without consistent spacing.
4. Stats strips (`statsStrip`) use `colors.surfaceSoft` + raw padding values — inconsistent.
5. `maxMarksWrapper` has a raw ad-hoc layout — would benefit from `AppInput` styling.
6. Student row uses raw `borderBottomWidth: 1, borderBottomColor: colors.border` separator — not `AppCard`.
7. `scoreInput` and `remarkInput` are raw `TextInput` without `AppInput` wrapper — different visual language from login form.
8. Sticky footer has raw `shadowColor: '#000'` — should use `shadows.md` token.
9. No progress bar showing marks entered vs total students for each exam or subject.
10. No visual completion state (e.g. green card border when all students are graded).

## Architectural Fix
- Replace raw style values throughout with typography/spacing/radii/shadow tokens.
- Replace all back button patterns with `TeacherScreenHeader` component which accepts a back action.
- Replace raw `TextInput` for score with `AppInput` styled wrapper with `keyboardType="number-pad"`.
- Student rows: wrap each in `AppCard style={{ marginBottom: spacing.xs }}` instead of bare `View` with manual border.
- Add a `marksProgress` computed value: `(marksEnteredCount / totalStudents) * 100` → render as a thin `View` progress bar below the stats strip.
- Footer: apply `shadows.md` instead of manual shadow properties.

## Visual Polish
- **Exam List Header**: `TeacherScreenHeader` "Exam Marks Entry" + subtitle.
- **Exam Cards** (`MarksExamCard`):
  - Exam name `typography.headingMedium`, class badge `StatusBadge`
  - Date in `typography.caption`
  - Stats strip: Subjects | Students | Marks Entered
  - Progress bar: thin `colors.teacher + '40'` track, `colors.teacher` fill, shows `marksEnteredCount/totalStudents`
  - Status badge: `scheduled` → `info`, `completed` → `success`
  - Footer "Manage Marks →" link with Ionicons `chevron-forward`
- **Subject Cards** (`MarksSubjectCard`):
  - Subject name bold, section name caption
  - Progress bar: graded / total students
  - "Enter Marks →" with Ionicons `chevron-forward`
- **Student Marks Entry**:
  - `TeacherScreenHeader` with back "← Back to Subjects", subject name, exam + class
  - Max Marks row as `AppCard` with `AppInput` styling for the input
  - Each student as `AppCard` — name/roll/adm on left, score `AppInput` + remarks `AppInput` on right
  - Inline field errors styled with `colors.danger + '15'` background
  - Sticky footer: `AppButton variant="secondary"` Cancel + `AppButton variant="teacher" gradient` Save Marks

## Interaction / Animation Recommendation
- Progress bar `Animated.timing` fill animation on load (0 → actual %).
- Score input auto-focuses next student on numeric entry + return key.
- Save button disables during `saving` with spinner.
- Error fields glow red border `colors.danger` on invalid state.

## Expected Files To Change
- `mobile/src/screens/teacher/TeacherMarksScreen.tsx` — full redesign (all 3 sub-views)
- `mobile/src/components/teacher/MarksExamCard.tsx` — new component
- `mobile/src/components/teacher/MarksSubjectCard.tsx` — new component
- `mobile/src/components/teacher/StudentMarksRow.tsx` — new component
- `mobile/src/components/teacher/TeacherScreenHeader.tsx` — reuse/create

## APIs Used (Unchanged)
- `getTeacherMarksExams()` — exam list
- `getTeacherMarksExamSubjects(examId)` — subject list
- `getTeacherMarksExamStudents(examId, subjectId)` — students + prefilled marks
- `saveTeacherMarks(examId, { subjectId, maxMarks, marks[] })` — submit

## Risk Level
**High** — Most complex screen. Three navigation states. Input validation logic must remain exactly as-is. Sticky footer z-index must not clip content. `KeyboardAvoidingView` behaviour must be preserved.

## Validation Needed
- Exam list renders with progress bars and correct stats.
- Tapping exam opens subject list.
- Tapping subject opens student entry view with pre-filled marks.
- Inline validation shows errors for out-of-range or non-numeric inputs.
- Max Marks update re-validates all student entries.
- Save sends correct payload — `{ subjectId, maxMarks, marks: [{ studentId, marksObtained, remarks }] }`.
- Sticky footer visible above keyboard.
- Back buttons navigate correctly: subject → exam, exam → root.
- Pull-to-refresh on exam list works.
- Empty states work at all 3 levels.
