# Phase 4.1F: Role Security UAT

Verification details of role access restrictions and data isolation.

## Fresh Corrective Pass Statement
* This was a fresh corrective UAT evidence pass.
* No source files were modified, and all validations were freshly rerun.

## Security Controls Audited
1. **Settings Route Isolation**:
   * Direct url navigation to `/settings/notifications` blocks non-admin users (e.g. `teacher`, `student`, `parent`) and redirects them to the main `/dashboard` page.
   * **Evidence**: [web_notification_center_access_denied_final_uat.png](screenshots/web_notification_center_access_denied_final_uat.png)
2. **API Endpoint Role Validation**:
   * All requests to endpoints prefixed with `/api/notifications/admin/` require standard auth tokens from users with `admin` or `super_admin` role in their session payload.
   * Any non-admin API calls fail with `403 Forbidden`.
3. **Data Segregation**:
   * Users can only fetch and update their own notifications. Direct queries trying to read another user's notifications are blocked at the request context.
   * Parent users only receive alerts for students linked to their parent database record.
   * Student users cannot access parent-only notifications (e.g. fee reminder logs).
