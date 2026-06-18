# Navigation Polish Notes

This document describes the bottom tab navigation adjustments implemented to support clean styling and vector iconography.

## Navigator Refactoring

Bottom tab navigators for all three user personas have been completely refactored to align with the new design tokens:
- **`StudentNavigator.tsx`**
- **`ParentNavigator.tsx`**
- **`TeacherNavigator.tsx`**

## Structural Refinements

1. **Height & Spacing**:
   - Tab bar height updated to `sizing.tabBarHeight` (68px).
   - Bottom padding dynamically adjusted for safe areas on iOS vs Android using `Platform.select`.

2. **Shadows & Borders**:
   - Replaced basic top thin border lines with elevated drop shadows (`shadows.md`).
   - Clean background color (`colors.surface`) matching card backgrounds.

3. **Active/Inactive Accent Tints**:
   - `Student`: Teal/Emerald accent (`colors.student`)
   - `Parent`: Royal Blue accent (`colors.parent`)
   - `Teacher`: Indigo/Purple accent (`colors.teacher`)
   - Inactive tabs display muted grey text/icon tint (`colors.mutedText`).
