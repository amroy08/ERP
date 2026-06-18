# Risk & Validation Plan — Phase 3.4

## High-Priority UAT Risks Identified
1. **Wrong role accessing another role screen**: Inadequate route isolation could allow unauthorized roles (e.g. students trying to access teacher marks screen) to view private paths.
2. **Stuck loading after pull-to-refresh**: Network delays or missing cleanup calls in refresh handlers could leave the refresh spinner spinning indefinitely.
3. **Child context not updating parent data**: When switching child context in Parent Academics/Attendance screens, UI elements might fail to update, displaying stale data for the previous child.
4. **Homework modal keyboard overlap**: In Student Homework Submission Modal, standard keyboards could overlay text response regions or obstruct cancel/submit buttons.
5. **Marks sticky footer clipping**: The save/submit sticky footer on Teacher Marks Entry Screen could clip behind bottom navigation tab bars or device safe area boundaries.
6. **Attendance submit payload mismatch**: Data structures sent from Teacher Attendance marked students list might mismatch backend REST API contracts.
7. **Fee outstanding values displaying incorrectly**: Calculation logic mismatches in the Outstanding Fees Summary Card hero could output values inconsistent with itemized ledgers.
8. **Empty state crashes from null arrays**: Failed backend queries or empty responses returning null arrays instead of empty lists could crash mapping layouts.
9. **Duplicate or stale dashboard data after switching children**: Switching child profile pills on Parent Dashboard HomeScreen could leave widgets or notice previews with previous children's data.
10. **Bottom navigation route mismatch**: Tapping tab bars could map to incorrect routes or cause tab state tracking failures.

## Automated Verification Tests
We will run full local compilations and parity tests:
```bash
# Typechecks
cd mobile && npx tsc --noEmit
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit

# Regression scripts
cd server
npx ts-node --transpile-only scripts/test-role-visibility-permission-audit.ts
npx ts-node --transpile-only scripts/test-attendance-timetable-parity.ts
npx ts-node --transpile-only scripts/test-web-homework-submission-parity.ts
npx ts-node --transpile-only scripts/test-web-exam-marks-parity.ts
```

## Manual Verification
- Walkthrough screens on active emulator Pixel_8 API 34.
- Exercise multiple children data context switches.
- Test keyboard visibility impacts.
