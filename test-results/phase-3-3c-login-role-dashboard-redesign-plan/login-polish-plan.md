# Login Screen Polish Plan

## Screen Name
- `LoginScreen` ([LoginScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/auth/LoginScreen.tsx))

## Current Purpose
- Authenticate users (Student, Parent, Teacher) via credential forms or role quick-access chips.

## Primary User Goal
- Easily and securely log in to the school ERP dashboard.

## The Current Issue
- The login screen was significantly modernized in Phase 3.3B. There are no major functional or layout issues, but minor spacing adjustments, visual shadows, status bar behavior, and key event focus states can be polished for a premium native feel.

## The Architectural Fix
- Minor modifications to [LoginScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/auth/LoginScreen.tsx) to align style boundaries with layout.ts spacing.

## The Visual Polish
- Standardize spacing parameters using global `spacing` tokens.
- Add soft transitions on field input focus.
- Polish quick-access chips with subtle scale properties on tap.

## Interaction / Animation Recommendation
- Use micro-scale animations (e.g., scale to `0.97` on press) for quick-access buttons and the login button.

## Files Expected To Change
- [LoginScreen.tsx](file:///Users/amroy/Desktop/ERP/mobile/src/screens/auth/LoginScreen.tsx)

## Risk Level
- Very Low

## Validation Needed
- Verify layout responsiveness across small viewports (e.g. 5.1" screen heights) with open soft keyboards.
