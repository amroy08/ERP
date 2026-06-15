# Parent Homework Review Visibility Notes — Phase 3.1G

## Parent Academics & Security Scoping

Parent profiles view children's academics under strict isolation checks:

1. **Academic Homework Tab**:
   - Parents navigate to the child's academic tab and see the child's homework items.
   - Shows reviewed and returned statuses along with graded marks and comments.

2. **File Privacy Controls**:
   - To keep storage safe and prevent file leaks, parent accounts do NOT receive file download paths or file access links.
   - Only file existence (e.g. filename) and submission dates are rendered.
   - Attempts to request raw filePath or access endpoints will fail with a 403 response code.
