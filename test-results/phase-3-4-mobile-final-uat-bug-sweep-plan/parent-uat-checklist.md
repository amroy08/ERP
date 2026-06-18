# Parent UAT Checklist — Phase 3.4

### 1. Parent Dashboard
* **Screen**: `ParentHomeScreen`
* **Primary flow**: Greeting hero, metrics, child profiles switcher, notices widget.
* **Data/API dependency**: `fetchParentDashboard`
* **User action to test**: Log in as Parent, scroll screen, review metrics cards.
* **Expected result**: Greeting and school details display. Metrics link to correct inner screens.
* **Possible bug/risk**: Visual layout issues with child switcher indicators.
* **Priority**: High

### 2. Child Switcher
* **Screen**: `ParentHomeScreen` & `ParentAcademicsScreen` (Child context header)
* **Primary flow**: Swaps context values dynamically between linked child profiles.
* **Data/API dependency**: `fetchParentDashboard`
* **User action to test**: Tap horizontal child name pills.
* **Expected result**: Switching child updates all metric cards and details instantly.
* **Possible bug/risk**: Selecting a new child retains stale dashboard values of the previous child.
* **Priority**: High

### 3. Parent Attendance
* **Screen**: `ParentAttendanceScreen`
* **Primary flow**: Tracks attendance rate metrics and logs history.
* **Data/API dependency**: `fetchParentAttendance`
* **User action to test**: Switch child profile lists, review metric cards (Present/Absent/Late/Rate), review timeline logs.
* **Expected result**: Metrics update per child. Logs show correct weekday date ranges and status tags.
* **Possible bug/risk**: Summary metric cards mismatch logs calculations.
* **Priority**: High

### 4. Parent Academics Timetable Tab
* **Screen**: `ParentAcademicsScreen` (Timetable tab view)
* **Primary flow**: Renders class timetable schedules.
* **Data/API dependency**: `getParentChildTimetable`
* **User action to test**: Tap TIMETABLE tab, select weekday pills, switch child context.
* **Expected result**: Displays room numbers, periods, timings, subjects, and teachers using `TodayScheduleCard`.
* **Possible bug/risk**: Class agenda lists show incorrect order.
* **Priority**: High

### 5. Parent Academics Homework Tab
* **Screen**: `ParentAcademicsScreen` (Homework tab view)
* **Primary flow**: Monitors child assignment tracking status details.
* **Data/API dependency**: `getParentChildHomework`
* **User action to test**: Tap HOMEWORK tab, click filters (All, Pending, Submitted), expand card details.
* **Expected result**: Details display due dates, feedback comments, grades, and description texts.
* **Possible bug/risk**: Expansion crashes screen, or filters fail.
* **Priority**: High

### 6. Parent Academics Exams Tab
* **Screen**: `ParentAcademicsScreen` (Exams tab view)
* **Primary flow**: Renders upcoming exam schedules.
* **Data/API dependency**: `getParentChildExams`
* **User action to test**: Tap EXAMS tab, review subjects list, verify date cards.
* **Expected result**: Exam schedules display start times, total marks, date badges, and countdown indicators.
* **Possible bug/risk**: Imminent countdowns (e.g. "2d left") missing.
* **Priority**: High

### 7. Parent Academics Results Tab
* **Screen**: `ParentAcademicsScreen` (Results tab view)
* **Primary flow**: Renders child graded results.
* **Data/API dependency**: `getParentChildResults`
* **User action to test**: Tap RESULTS tab, check subjects scores, grade cards, and bars.
* **Expected result**: Renders obtained scores vs total max, letter grades, and color-coded progress bars.
* **Possible bug/risk**: Percentage progress bar length or grade colors are incorrect.
* **Priority**: High

### 8. Parent Fees
* **Screen**: `ParentFeesScreen`
* **Primary flow**: Outstanding invoice ledgers and balance summary.
* **Data/API dependency**: `fetchParentFees`
* **User action to test**: Open Fees screen, toggle student list filter, review outstanding summary card hero, review fee ledgers cards.
* **Expected result**: Ledger calculates balances (Total, Paid, Outstanding) matching billing schemas.
* **Possible bug/risk**: Arithmetic calculations in outstanding balance hero are mismatching.
* **Priority**: High

### 9. Parent Notices
* **Screen**: `ParentNoticesScreen`
* **Primary flow**: School announcement bulletin circles.
* **Data/API dependency**: `fetchParentNotices`
* **User action to test**: Open Notices screen, check priority badges, click notice card to expand/collapse.
* **Expected result**: Expansion functions smoothly. Priority badge matches notice priority.
* **Possible bug/risk**: Description content clipped.
* **Priority**: Medium
