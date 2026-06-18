# Component Reuse Notes

## Reused Base Components
We heavily utilized the base components established in the Phase 3.3B design system:
- `ScreenContainer.tsx` (Provides consistent top notch and status bar offsets)
- `AppCard.tsx` (Provides premium shadow, border radii, and styling for list items)
- `AppButton.tsx` (Used in login actions)
- `AppInput.tsx` (Used in login forms)
- `SectionHeader.tsx` (Provides consistent margins and bold uppercase section titles)
- `StatusBadge.tsx` (Renders semantic colors and badges for roles and priorities)
- `EmptyState.tsx` (Standardized empty notices, schedule alerts, and linked children alerts)
- `ErrorState.tsx` (Unified retry behavior on dashboard load failures)

## New Shared Dashboard Components
To reduce layout duplication and maintain mobile-only codebase hygiene, we introduced:
- `DashboardHero.tsx` (Curved banner gradient wrapper showcasing role tags and user metadata)
- `MetricCard.tsx` (Icon, value, and label indicator block)
- `NoticePreviewCard.tsx` (Clean notice list row mapping priorities)
- `QuickActionButton.tsx` (Grid item button linking shortcuts)
- `TodayScheduleCard.tsx` (Period timeline row component)
- `ChildContextHeader.tsx` (Horizontal avatar switcher chips list)
