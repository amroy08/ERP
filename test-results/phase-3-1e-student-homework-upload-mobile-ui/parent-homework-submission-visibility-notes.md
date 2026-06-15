# Parent Homework Submission Visibility Notes - Phase 3.1E

## Security Isolation & Display Details

### 1. Visibility Check
- Logged in as parent `parent@school.com` / `Admin@123`.
- Navigated to the child switcher tab and checked homework.
- The homework list displays the child's assignment along with their submission status (e.g. `late`, `submitted`).
- The filename of the child's upload is displayed for informational transparency.

### 2. Security Bounds
- Parents do not receive download links or raw paths to files in this phase, complying with secure backend requirements.
- Attempting to query homework submission details for a student not linked to the parent profile yields `403 Access Denied`.
- No crashes occurred during visibility switches.
