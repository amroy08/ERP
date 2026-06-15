# Phase 3.1J: Teacher Marks Mobile UI - Design & Validation Notes

## Visual & Aesthetics Design
The interface fully complies with the Phase 3.0H light ERP design specification:
- **Clean Backgrounds**: Styled using clean `colors.background` (#F9FAFB) with white card overlays to project a premium, clutter-free vibe.
- **Accents**: Subtle blue/violet accents (`colors.teacher` #8B5CF6) are applied to buttons, selected statuses, and active highlights.
- **Typography**: Employs clean font weight variables and proper margins to ensure excellent scanning capability.
- **Status Badges**: Uses rounded badges with soft background tints for exam statuses and roles.

## Dynamic Inputs & Keyboard Usability
- **Keyboard-Aware Layout**: KeyboardAvoidingView wraps the screen to adjust height when the keyboard opens. The list scroll padding is increased to `120px` to make sure the lowest student rows can be scrolled above the sticky footer.
- **Form Layout**: Each row has a side-by-side score input (numeric-only) and a remark input (standard text), providing high speed and density for the teacher.

## Live Client-Side Validations
To optimize user experience and save network roundtrips:
- **Max Marks**: Must be a positive integer. Editing this input dynamically re-validates all students' entered scores in real time.
- **Scores**:
  - Must be a valid positive integer/numeric value.
  - Can be left blank if a student is absent or does not need marking (supports partial bulk save).
  - Must not be negative (blocked immediately with a message).
  - Must not exceed the Max Marks limit. If exceeded, the input turns red and shows an inline warning: `Max is [value]`.
- **Save Blockers**: The "Save Marks" action is blocked if any validation errors are active on the screen or if no students have marks entered.
