# Visual Consistency Audit — Phase 3.3G

## Layout & Rhythm Spacing
- [x] Margins: Unified `spacing.xl` and `spacing.lg` constants handle safe boundaries.
- [x] Cards: Consistent `radii.md` corner angles and fine border lines apply cleanly.
- [x] Headers: Uniform custom header layouts (`TeacherScreenHeader`, `StudentScreenHeader`, `ParentScreenHeader`) render roles styling.

## Themes & Colors
- [x] Teacher Theme: Accent `colors.teacher` (Indigo theme profile).
- [x] Student Theme: Accent `colors.student` (Blue/Teal theme profile).
- [x] Parent Theme: Accent `colors.parent` (Purple theme profile).
- [x] Accent color rules are strictly respected across buttons, headers, switcher tabs, pills, and metric borders.
- [x] No generic styling or hardcoded fallback codes.

## Content & Graphics
- [x] Replaced previous generic emoji placeholders with high-fidelity components, icons (`Ionicons`), or custom status labels.
- [x] Font Hierarchy: Typography styles (`typography.headingLarge`, `typography.caption`, `typography.labelSmall`) are strictly respected.
- [x] Thumb-friendly navigation tabs and pills avoid clipped boundaries.
- [x] Sticky footers remain positioned above bottom navigator margins.
