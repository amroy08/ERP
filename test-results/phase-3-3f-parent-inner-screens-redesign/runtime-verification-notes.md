# Runtime Verification Notes — Phase 3.3F

## Test Environment
- Device: Android Emulator (Pixel_8 API 34)
- Metro Bundler Port: 8081
- Vantage ERP Backend Service: Local (localhost:3000)

## Parent Attendance Screen
- The page renders correctly with the custom header.
- Summary metric cards correctly aggregate Present, Absent, Late days, and the overall Attendance % rate.
- Recent logs show date stamps alongside custom success/warning/danger status tags.

## Parent Academics Screen
- Top segmented tabs change actively.
- **Timetable**: Lists child schedules grouped under weekday tabs (e.g. Mon, Tue).
- **Homework**: Show total outstanding assignments warning header, filters, and expanded task details including feedback.
- **Exams**: Displays exam details with countdown labels (e.g., "3d left") and date tags.
- **Results**: Correctly maps score cards, color-coded grades, and completion progress bars.

## Parent Fees Screen
- Hero banner calculates and highlights total outstanding invoices.
- Ledger details show specific billing structures, paid amounts, and due thresholds.

## Parent Notices Screen
- Render bulletin entries.
- Collapsible cards expand correctly upon click to reveal content details.
