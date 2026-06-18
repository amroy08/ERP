# Phase 4.0: Mobile Parent UAT Checklist

**Platform**: Mobile App — Parent Role
**Test Credentials**:
- Parent 1: `parent.adm20267881@school.local` (Meera Kapoor) — verify password
- Parent 2: `parent.adm20265789@school.local` (Ayan Sethi) — verify password
- Parent 3: `parent.adm20269283@school.local` (Dhruv Iyer) — verify password
**Real data basis**: Live `school_erp` database
**Device/Emulator**: Pixel_8 API 34 (Android Emulator)

---

## Pre-Check: Credential Verification
- [ ] Confirm at least 1 parent email can log in (parent passwords are auto-generated — may need admin reset)
- [ ] Confirm parent is linked to at least 1 child (student record in `parents` table)
- [ ] Identify the child's class/section and check which data records exist for that child

---

## 1. Parent Login
- **Screen**: `LoginScreen`
- **Flow**: Enter parent email → enter password → tap Login
- **Expected**: Redirects to `ParentHomeScreen`; parent's real name shown in greeting
- **Risk**: Auto-generated parent password unknown — may need admin reset before UAT
- **Priority**: P1 / Read

---

## 2. Parent Dashboard — Child Context
- **Screen**: `ParentHomeScreen`
- **Flow**: View dashboard after login; observe child selector pill(s)
- **Real data to verify**:
  - Child's real name shown (e.g., the student linked to Meera Kapoor)
  - Child's class and section shown
  - Attendance summary widget: real attendance percentage
  - Fee outstanding widget: real outstanding balance amount
  - Notice preview: any of the 4 real notices
- **Expected**: All widgets populate with child-specific real data
- **Risk**: Dashboard shows zeros across all widgets due to parent-child link misconfiguration
- **Priority**: P1 / Read

---

## 3. Parent Attendance — Child Attendance Rate
- **Screen**: `ParentAttendanceScreen`
- **Flow**: Tap Attendance tab → view child attendance
- **Real data to verify**: 32 attendance records in DB; any records for this parent's child
- **Expected**: Attendance percentage shown (e.g., 87%); monthly/date-wise history listed
- **Risk**: Empty state shown even when attendance records exist for child
- **Priority**: P1 / Read

---

## 4. Parent Academics — Tab Navigation
- **Screen**: `ParentAcademicsScreen`
- **Flow**: Tap Academics tab → swipe through sub-tabs (Timetable / Homework / Exams / Results)
- **Expected**: Each sub-tab loads relevant data; no crash on tab switch
- **Risk**: Sub-tab showing loading spinner indefinitely on first switch
- **Priority**: P1 / Read

---

## 5. Parent Academics — Timetable Tab
- **Screen**: `ParentAcademicsScreen` (Timetable tab)
- **Real data to verify**: 3 timetable_entries; entries for child's class/section visible
- **Expected**: Day-wise schedule shown; EmptyState shown for days with no entries
- **Risk**: Empty for all days even when entries exist for child's class
- **Priority**: P1 / Read

---

## 6. Parent Academics — Homework Tab
- **Screen**: `ParentAcademicsScreen` (Homework tab)
- **Real data to verify**: 3 homework records; those for child's class shown
- **Expected**: Homework list with subject, due date, child's submission status
- **Risk**: Submission status showing "pending" even if child submitted
- **Priority**: P1 / Read

---

## 7. Parent Academics — Exams Tab
- **Screen**: `ParentAcademicsScreen` (Exams tab)
- **Real data to verify**: 3 exams — Quarterly Quiz, Sync Exam, First Term Examination
- **Expected**: All relevant exams shown with name, type, dates
- **Risk**: Past exams hidden by date filter
- **Priority**: P1 / Read

---

## 8. Parent Academics — Results Tab
- **Screen**: `ParentAcademicsScreen` (Results tab)
- **Real data to verify**: 5 result records exist; at least 1 may belong to parent's linked child
- **Expected**: Score cards show marks, %, grade per subject/exam
- **Risk**: Empty results even when marks exist; or results for wrong child shown
- **Priority**: P1 / Read

---

## 9. Parent Fees — Outstanding Balance
- **Screen**: `ParentFeesScreen`
- **Flow**: Tap Fees tab → view outstanding balance
- **Real data to verify**: 805 student fee rows (802 pending, 3 partial); fee payments: 52
- **Expected**: Hero card shows total outstanding amount for parent's child; breakdown by fee item
- **Risk**: Balance showing ₹0 when pending fees exist; negative balance if payment calculation error
- **Priority**: P1 / Read

---

## 10. Parent Fees — Fee Ledger Detail
- **Screen**: `ParentFeesScreen` (itemized ledger)
- **Flow**: Scroll below the balance hero → view individual fee line items
- **Real data to verify**: Fee structure items (Term 1 Fee, Tuition Fee, Books & Stationery) assigned to student
- **Expected**: Each fee item shows amount due, amount paid, balance
- **Risk**: Fee items showing wrong amounts if fee structure not correctly joined
- **Priority**: P1 / Read

---

## 11. Parent Notices
- **Screen**: `ParentNoticesScreen`
- **Flow**: Tap Notices tab → view circular list
- **Real data to verify**: 4 notices; those with audience PARENT or ALL visible
- **Expected**: At least the ALL-audience notices appear; collapsible items expand/collapse correctly
- **Risk**: No notices shown if audience filter excludes PARENT
- **Priority**: P1 / Read

---

## 12. Multi-Child Context Switch (If Applicable)
- **Screen**: `ParentHomeScreen` — child selector pills
- **Flow**: If parent has multiple children, switch child context using the pill selector
- **Expected**: All widgets update to reflect selected child's data; no stale data from previous child
- **Risk**: Dashboard retains previous child's data after switching; duplicate API calls causing confusion
- **Priority**: P1 / Read

---

## 13. Bottom Navigation
- **Flow**: Tap each bottom tab (Home, Attendance, Academics, Fees, Notices)
- **Expected**: Correct screen loads; active tab highlighted
- **Risk**: Fees tab route pointing to wrong screen
- **Priority**: P1 / Read

---

## 14. Pull-to-Refresh
- **Flow**: Pull down on each of the 5 parent screens
- **Expected**: Content reloads fresh from server; spinner dismisses correctly
- **Priority**: P1 / Read

---

## 15. Logout
- **Flow**: Logout action → redirected to LoginScreen
- **Expected**: Parent session cleared; no child data visible on re-login of different account
- **Priority**: P1 / Read

---

## Pass Criteria
- Parent login succeeds; child's real name and class shown on dashboard
- Attendance screen shows real percentage and history (not empty when 32 records exist)
- Fees screen shows real outstanding balance for child (not ₹0 when pending fees exist)
- All 4 Academics sub-tabs load without crash
- 4 published notices visible (at least ALL-audience ones)
- No data cross-contamination between children on context switch
