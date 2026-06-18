# Student Exams / Results Redesign Plan

## Screen Name
`StudentExamsScreen`

## Current Purpose
Displays upcoming exam schedules (subject, date, timing, total marks) and published exam results (subject, marks obtained, percentage, grade).

## Primary Student Goal
Check upcoming exam timings and analyze performance metrics across graded subjects.

## The Current Issue
- The tab toggle is composed of plain styled texts.
- Exam cards look plain and lack alignment with the premium card designs.
- Days left counter uses basic red text without context.
- Progress bars for exam marks are simple horizontal bars without rounded tracks or matching color gradients.

## The Architectural Fix
- Use `StudentScreenHeader` with exams count.
- Extract or design a unified tab selection control.
- Design `ExamResultCard` layout to represent both scheduled papers (with prominent calendar block) and published results (with progress bar, grade badge, and percentage).
- Preserve `fetchStudentExams` and `fetchStudentResults` API integrations.

## The Visual Polish
- Display a visually appealing calendar date badge for upcoming exams (e.g. bold date digit with short month name beneath, styled container).
- Apply gradient progress indicators or color-coded performance fills: `percentage >= 75%` (green), `>= 50%` (yellow), else (red).
- Design premium grade badges matching the color coding of the grade.

## Interaction / Animation Recommendation
- Animate tab transition swaps (fade and slide layout).
- Smooth progression fill animation on card load.

## Expected Files To Change
- `mobile/src/screens/student/StudentExamsScreen.tsx` (Modify)

## Risk Level
Low (No API changes, only visual redesign).

## Validation Needed
- Verify toggle navigation between "Upcoming" and "Results" screens.
- Test date conversion formats and days-left countdown arithmetic.
- Verify color codes mapped on result grades and percentages.
- Verify `EmptyState` renders for blank responses.
