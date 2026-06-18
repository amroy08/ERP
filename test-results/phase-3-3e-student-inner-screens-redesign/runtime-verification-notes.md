# Runtime Verification Notes — Phase 3.3E

## Test Environment
- Device: Android Emulator (Pixel_8 API 34)
- Metro Bundler Port: 8081
- Vantage ERP Backend Service: Local (localhost:8081)

## Timetable Screen
- Day selection pills render properly.
- Selecting a day loads scheduled class blocks containing timings, room description, subject, and teacher.
- A warning/context banner appears highlighting today's scheduled period counts.

## Homework Screen & Submission Modal
- Filter segment controls are functional.
- The homework overview lists assignments with custom status indicators and overdue highlight rules.
- Expanding card launches details and triggers submissionmodal picker actions.
- Attachment picker operates, checks file sizes/extensions, and displays the chosen attachment detail card correctly.

## Exams & Results
- Toggle tabs swap between schedules and grade results successfully.
- Imminent exam countdowns highlight properly.
- Results progress fill tracks are color-coded by grade categories.
