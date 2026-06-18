# Shared Component Reuse & New Components Plan

## Reuse Strategy
To maintain brand and role consistency across the app, we will utilize the Phase 3.3B foundational layout blocks first before building parent-specific components.

## Existing Components To Reuse

1. **`ScreenContainer`**
   - Location: `mobile/src/components/ScreenContainer.tsx`
   - Purpose: Unified screen wrapper that handles layouts and safe area inserts.

2. **`AppCard`**
   - Location: `mobile/src/components/AppCard.tsx`
   - Purpose: Standard card style with unified shadows and border radii.

3. **`StatusBadge`**
   - Location: `mobile/src/components/StatusBadge.tsx`
   - Purpose: Priority tags on notices and state badges on other details.

4. **`EmptyState`** & **`ErrorState`**
   - Location: `mobile/src/components/EmptyState.tsx`, `ErrorState.tsx`
   - Purpose: Feedback screens for loading errors or empty arrays.

5. **`ChildContextSwitchHeader`** (or `ChildContextHeader`)
   - Location: `mobile/src/components/dashboard/ChildContextHeader.tsx`
   - Purpose: Switch the active child profile on Academics, Attendance, and Fees screens.

6. **`TodayScheduleCard`**
   - Location: `mobile/src/components/dashboard/TodayScheduleCard.tsx`
   - Purpose: Render agenda cards inside the parent's academics timetable sub-tab.

---

## Proposed New Reusable Components

We propose creating the following helper components to clean up screen-level code:

### 1. `ParentScreenHeader`
- **Location**: `mobile/src/components/parent/ParentScreenHeader.tsx`
- **Purpose**: Page header featuring the page title, back button support, subtext indicators, and count badges.
- **Props**:
  ```typescript
  interface ParentScreenHeaderProps {
    title: string;
    subtitle?: string;
    badge?: string | number;
    onBack?: () => void;
    backLabel?: string;
  }
  ```

### 2. `AttendanceSummaryCard` (Internal to Attendance Screen or Shared)
- **Purpose**: Renders the 4-column summary metric boxes (Present, Absent, Late, and Rate) cleanly with themed status colors.

### 3. `FeeLedgerCard` (Internal to Fees Screen or Shared)
- **Purpose**: Unified card to show billing metrics, invoices breakdown (Total, Paid, Due), progress ratios, and deadlines.
