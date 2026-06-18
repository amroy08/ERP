# Student Homework Submission Modal Redesign Notes

## Changes Applied
- Re-styled form modal backdrop and header with checkmark submit indicators.
- Added a due date warning badge at the top of the form.
- The multiline answer field matches ERP theme inputs (with custom borders, background colors, and padding).
- Picking a file draws a detailed attachment card highlighting the file format (📄 icon), size, filename, and delete action.

## Intentionally Left Unchanged
- `expo-document-picker` async selectors.
- File validation criteria (10MB size limit, extension constraints).
