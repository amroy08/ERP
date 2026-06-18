# Implementation Plan – Phase 3.3E: Student Inner Screens Premium Redesign

## Goal Description
Redesign the remaining student inner screens (`StudentTimetableScreen`, `StudentHomeworkScreen`, `StudentExamsScreen`, and the helper modal `HomeworkSubmissionModal`) to conform to the premium Phase 3.3B design system and Phase 3.3C dashboard styling.

## User Review Required
No major breaking changes are introduced. No schema changes, route changes, or backend alterations will be made.

## Open Questions
- None. All requirements are well-specified.

## Proposed Changes

### Mobile Client Component & Screen Updates

#### [MODIFY] [StudentTimetableScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentTimetableScreen.tsx)
- Redesign the day selectors into premium pill components with dot active indicators.
- Replace basic period listing card blocks with `TodayScheduleCard` to unified visual styling.
- Integrate `StudentScreenHeader` for unified heading and subtitle info.

#### [MODIFY] [StudentHomeworkScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentHomeworkScreen.tsx)
- Add standard `StudentScreenHeader` with notices/pending status badge.
- Polish status badges and details expansion using smooth LayoutAnimation toggles.
- Redesign text answer displays, marks details, feedback components.

#### [MODIFY] [HomeworkSubmissionModal.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/components/HomeworkSubmissionModal.tsx)
- Styled using clean text inputs, premium border structures, and a dedicated select-file card with deletion states.
- Support progress animation states on submitting records.

#### [MODIFY] [StudentExamsScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/student/StudentExamsScreen.tsx)
- Polish Tab toggle buttons with custom backgrounds and active highlights.
- Highlight upcoming exams with custom calendar-date blocks.
- Add progress bars on Results tab colored by grades or percent tiers.

#### [NEW] [StudentScreenHeader.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/components/student/StudentScreenHeader.tsx)
- Renders page title, subtitles, back triggers, and alert/info badges with student role color presets.

## Verification Plan

### Automated Tests
- Run TypeScript validations:
  ```bash
  cd mobile && npx tsc --noEmit
  cd server && npx tsc --noEmit
  cd client && npx tsc --noEmit
  ```
- Run server-side parity checks:
  ```bash
  cd server
  npx ts-node --transpile-only scripts/test-role-visibility-permission-audit.ts
  npx ts-node --transpile-only scripts/test-attendance-timetable-parity.ts
  npx ts-node --transpile-only scripts/test-web-homework-submission-parity.ts
  npx ts-node --transpile-only scripts/test-web-exam-marks-parity.ts
  ```

### Manual Verification
- Test all redesigned screen navigation flows.
- Verify status filtering.
- Take emulator screenshots for the redesigned screens.
