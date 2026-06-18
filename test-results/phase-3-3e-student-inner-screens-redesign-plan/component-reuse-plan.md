# Component Reuse Plan – Phase 3.3E

## Reusable Components from Phase 3.3B/C/D
We will reuse the following existing components to maintain a single unified design system:

| Component | Target Screen | Purpose / Adaptation |
|---|---|---|
| `ScreenContainer` | All Screens | Safe area view layout bounds |
| `AppCard` | All Screens | Standard premium card wrapper |
| `AppButton` | Homework (Submission modal) | Custom action button for submit/cancel |
| `AppInput` | Homework (Submission modal) | Styled text inputs for submissions |
| `StatusBadge` | Homework | Color-coded status representation |
| `EmptyState` | All Screens | Displays friendly blank state states |
| `ErrorState` | All Screens | Renders connection/network error cards |
| `TodayScheduleCard` | Timetable | Used to draw class schedules exactly like on the dashboard |

## Proposed Student-Specific Reusable Components
To avoid duplication and organize modular code, we will place clean helper components in `mobile/src/components/student/` or directly inside the screen directories if they are local:

1. **`StudentScreenHeader`**:
   - Path: `mobile/src/components/student/StudentScreenHeader.tsx`
   - Props: `title: string`, `subtitle?: string`, `badge?: string | number`, `onBack?: () => void`, `backLabel?: string`.
   - Styled using `colors.student` and unified typography presets.

2. **`HomeworkTaskCard`**:
   - Path: `mobile/src/components/student/HomeworkTaskCard.tsx` (or inside screens).
   - Renders individual assignments with due date formatting, text descriptions, status badges, and expandable panels.

3. **`ExamResultCard`**:
   - Path: `mobile/src/components/student/ExamResultCard.tsx`.
   - Standardizes the progress bar rendering, color-coded score calculations, and grade badge colors.
