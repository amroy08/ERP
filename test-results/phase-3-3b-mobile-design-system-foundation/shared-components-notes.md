# Shared Components Design Notes

This document highlights the upgrades to the core components of the mobile app to use the new design tokens and maintain backward compatibility.

## Core Component Upgrades

### 1. `AppButton.tsx`
- Refactored using standard spacing, border radii, and gradients.
- Added support for touch scaling animations via `Pressable` layout transitions.
- Supports leading/trailing vector icons.
- Backward compatibility: Retained `style`, `loading`, and basic text layout options.

### 2. `AppCard.tsx`
- Integrates standard `shadows.md` or `shadows.lg` dynamically.
- Supports dynamic `padding` levels and accent borders matching student/parent/teacher active indicators.
- Backward compatibility: Retained standard children nesting.

### 3. `AppInput.tsx`
- Redesigned fields with clean label typography, input text values, and error state indicators.
- Focus state updates the border dynamically to `colors.primary`.
- Password text visibility toggle (secureTextEntry helper).
- Backward compatibility: Works with existing form states.

### 4. `EmptyState.tsx` & `ErrorState.tsx`
- Refactored inline styling to use `spacing` and `typography` scales.
- Maintained fallback support for existing textual/emoji props while introducing vector icon layouts.

### 5. `ScreenContainer.tsx`
- Safe area margins and custom gradient backdrops now leverage `spacing.screenPadding` and global status bar heights.

### 6. `StatusBadge.tsx`
- Refactored badge layout utilizing `colors.successSoft`, `colors.dangerSoft`, etc.

## New Added Base Components

### 1. `AppIcon.tsx`
- Helper wrapper around Expo's `Ionicons` ensuring consistent icon size, scale, and color mappings.

### 2. `SectionHeader.tsx`
- Consistent title headers for sections across all lists.
