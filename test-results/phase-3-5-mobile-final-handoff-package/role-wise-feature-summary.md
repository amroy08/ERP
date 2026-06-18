# Role-wise Feature Summary — Phase 3.5

The mobile application implements role-based screen routing and features as summarized below:

## 1. Teacher Features
- **Dashboard**: Greeting banner, classes schedule overview metrics, quick-action navigation cards.
- **Attendance**:
  - Class listings showing student assignment counts (e.g. 28 students).
  - Attendance marking roster list supporting status selectors (Present/Absent/Late).
  - Batch present toggling and reset triggers.
- **Timetable**: Swipable daily calendar agendas containing times, room numbers, subjects, and groups.
- **Homework**:
  - Assignment listing tracking submission ratios.
  - Submissions list showing student answer notes, status, and attachment download cues.
  - Roster grade entry inputs and remark feedback comment textareas.
- **Marks**:
  - Active exam schedules list selection.
  - Target classes/subjects list view showing completion percentages.
  - Scores entry grid validating that inputs remain locked between 0 and 100 max values.
- **Notices**: School circular bulletins list with collapsible descriptions.

---

## 2. Student Features
- **Dashboard**: Hello greetings, metrics summaries, notice previews.
- **Timetable**: Weekly class timetable schedules with subject, hour, room, and teacher info. Renders `EmptyState` fallbacks on weekends/holidays.
- **Homework**:
  - Assignments list filterable by status tabs (All, Pending, Submitted).
  - Expandable detail cards showing homework guidelines, submission history, and teacher review scores/feedback.
- **Homework Submission Modal**: Allows keying in text answers, shows attachment indicators, and handles submit triggers.
- **Exams/Results**:
  - Exams schedule calendars with countdowns.
  - Graded results reports showing obtained vs max scores and color-coded progress bars.
- **Notice Preview**: Carousel previews on student dashboard keeping key bulletins visible.
- **Attendance Summary**: Visual metrics tracking present vs absent counts (e.g. 67%, 4/6 days).

---

## 3. Parent Features
- **Dashboard**: Parent greeting, child switcher selector, child metrics summaries (Attendance, Fees, Homework, Timetable).
- **Child Switcher**: Tap name badges to instantly query and update context child information.
- **Attendance**: Child detailed attendance percentage metrics timeline history list.
- **Academics Timetable**: Timetable sub-tab showing child weekly period details.
- **Academics Homework**: Homework sub-tab tracking assignment deadlines, status tags, description guidelines, and teacher marks.
- **Academics Exams**: Exams sub-tab showing upcoming test dates, timings, and rooms.
- **Academics Results**: Results sub-tab visualizing obtained grades and progress bars.
- **Fees**: Outstanding invoice ledger list calculations (Total Billing, Paid, Outstanding Due balances).
- **Notices**: Announcement circles bulletin board for parents.
