# Risk & Validation Plan – Phase 3.3E

## Identified Risks
1. **Document Selection and Cache Handling**:
   - Picking files using `expo-document-picker` depends on external system actions.
   - Mitigated by testing on physical/emulated devices, checking extension filters, and verifying file sizes.
2. **State Synchronization**:
   - Submitting homework needs to immediately update the dashboard count (Pending HW) and list items.
   - Mitigated by calling the reloading callbacks (`loadHomework(true)` or `loadDashboard(true)`) post-submit.
3. **Empty Data and Nullable Values**:
   - Null teacher names, undefined room coordinates, missing descriptions can cause crashes.
   - Mitigated by implementing null coalescing fallbacks (`?? ''`) for all string values.

## Validation Plan

### Automated Checks
- Type checking: `npx tsc --noEmit` on mobile, client, and server.
- Execution of server regression scripts:
  - `test-role-visibility-permission-audit.ts`
  - `test-attendance-timetable-parity.ts`
  - `test-web-homework-submission-parity.ts`
  - `test-web-exam-marks-parity.ts`

### Manual Quality Assurance & Screenshots
Capture the following screenshots post-redesign:
1. `student_timetable_after_3_3e.png`
2. `student_homework_list_after_3_3e.png`
3. `student_homework_submission_modal_after_3_3e.png`
4. `student_exams_upcoming_after_3_3e.png`
5. `student_exams_results_after_3_3e.png`
