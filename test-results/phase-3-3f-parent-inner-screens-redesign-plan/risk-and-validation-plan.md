# Risk and Validation Plan

## Identified Risks

1. **Child Switcher Discrepancies**:
   - *Risk*: Parents expect child contexts to be consistent. If a child is selected on the Home Screen, should that selection carry over to Academics and Attendance?
   - *Mitigation*: Maintain local state within each screen for now to avoid side effects, but set the initial default child context to match the first child in the array. Ensure the selected child context is visible at the top.

2. **Null/Undefined Statistics Data**:
   - *Risk*: A child might have no attendance records or fee invoices. If the screen assumes arrays exist, the app could crash.
   - *Mitigation*: Ensure robust null checks, optional chaining (`child.records?.map(...)`), and proper fallback renders (`EmptyState`) are implemented.

3. **Segmented Tabs in Academics Screen**:
   - *Risk*: Too many tabs (Timetable, Homework, Exams, Results) can overflow on smaller mobile screens.
   - *Mitigation*: Use a compact padding design, clean typography weights, and moderate size guidelines to fit comfortably in a 4-column layout on standard widths.

---

## Validation Plan

### Phase 1: Type Checking
Run typescript compiler verification checks:
```bash
cd mobile
npx tsc --noEmit
```

### Phase 2: Integration Checks
- Verify data mapping from `fetchParentAttendance`, `fetchParentFees`, `fetchParentNotices`, and `getParentChildTimetable`.
- Confirm correct visual styling of list dividers, metric cards, calendar symbols, and progress indicators.
- Test fallback empty pages under empty list mock configurations.
