# Phase 4.1E: Security and Access Control Notes

Access control controls access permissions for settings and logs dashboard.

## Role Guard
* Only users with the role `admin` or `super_admin` can load the page.
* Non-admin roles (e.g. `teacher`, `student`, `parent`) are blocked at:
  1. **Route Guard**: The router redirects unauthorized access attempts to `/dashboard`.
  2. **Sidebar Level**: The menu link is hidden from the sidebar layout.
  3. **Backend API Level**: Auth request check guards throw a `403 Forbidden` response to unauthorized calls.
