# Security Access Notes

- **Endpoint access**: Checked that the manual runner endpoint rejects roles `teacher`, `student`, and `parent` with `403 Forbidden`. Only role values `admin` and `super_admin` (lowercase, matching the database values) are authorized.
- **Recipient constraints**: Reminders are strictly parent-targeted. Students do not receive `FEES_REMINDER` notifications.
- **Data scope**: Parents can only access notifications linked to their child.
- **Payload safety**: The API returns strictly metrics and counts, with zero leak of private student/parent/fee/attendance details.
