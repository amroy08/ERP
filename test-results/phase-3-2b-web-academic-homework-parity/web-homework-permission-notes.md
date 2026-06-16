# Phase 3.2B — Web Homework Permission Audit Notes

## Audit Date
2026-06-16

## Permission Model

### Middleware Stack (all 4 new endpoints)
```
protect → authorize(PERMISSIONS.HOMEWORK_VIEW) → checkModuleEnabled('ACADEMICS') → handler
```

### Role Behavior Verified

| Role | GET submissions list | GET submission detail | PATCH review | GET download |
|---|---|---|---|---|
| admin | ✅ 200 (full school) | ✅ 200 | ✅ 200 | ✅ 200 / 404 (no file) |
| super_admin | ✅ (same as admin) | ✅ | ✅ | ✅ |
| teacher | ✅ scoped to assigned hw | ✅ scoped | ✅ scoped | ✅ scoped |
| student | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |
| parent | ❌ 403 | ❌ 403 | ❌ 403 | ❌ 403 |

## Staff Permission Note
Staff roles that have `PERMISSIONS.HOMEWORK_VIEW` will be granted access following the same logic as admin.  
Staff roles without this permission will receive 403. No code changes needed — existing RBAC handles it.

## Validation Checks

### Invalid Review Status
- Payload: `{ status: "hacked" }`
- Result: `400 Bad Request` ✅

### Negative Marks
- Payload: `{ marks: -5 }`
- Result: `400 Bad Request` ✅

### Invalid Marks (NaN/string)
- Only numeric values accepted by backend validation ✅

## Security Checks

### filePath Exposure
- `filePath` column is NEVER returned in any response ✅
- Only `fileName`, `mimeType`, `fileSize`, `canDownload` metadata is returned
- Download is served via dedicated `/download` endpoint with auth check

### Download Security
```typescript
const absolutePath = path.resolve(privateBase, filePath!);
if (!absolutePath.startsWith(privateBase)) {
  return res.status(400).json({ ... }); // path traversal rejected
}
```
- Path traversal attack blocked ✅
- Missing file returns 404 ✅
- Unauthenticated download blocked (401) ✅
- Student/Parent download blocked (403) ✅

### IDOR Check
- Fabricated submissionId returns 404 (not 200/500) ✅
- Teacher attempting another teacher's homework returns 403 ✅

## Test Script Coverage
`scripts/test-web-homework-submission-parity.ts`:
- Step 3: Student/Parent 403 check (3×2 = 6 assertions)
- Step 6: Invalid status 400 check
- Step 7: Negative marks 400 check
- Step 8: Download security (student/parent 403, admin 200/404)
All: PASS ✅
