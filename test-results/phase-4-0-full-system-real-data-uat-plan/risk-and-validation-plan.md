# Phase 4.0: Risk & Validation Plan

## High-Priority UAT Risks

### Data Integrity Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Fee balance calculation wrong for partial payments | Medium | High | Verify formula: `totalFee - SUM(payments)` for sample student |
| R2 | Parent linked to wrong child (parentId mismatch) | Low | Critical | Query `parents` table to confirm parent-student linkage before UAT |
| R3 | Attendance records not scoped to current academic year | Medium | High | Check `attendance` rows include `academicYearId` = current year |
| R4 | Results showing for wrong student/exam pair | Low | High | Verify result rows: `SELECT * FROM results WHERE studentId='<id>'` |
| R5 | Student fee rows duplicated for same student+structure | Low | High | `SELECT studentId, COUNT(*) FROM student_fees GROUP BY studentId HAVING COUNT(*)>1` |

### Security / Role Isolation Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R6 | Teacher accessing student's private results | Low | Critical | Verify API middleware enforces `schoolId` scoping |
| R7 | Parent accessing another parent's child data | Low | Critical | Test with two different parent accounts; confirm data isolation |
| R8 | Student viewing another student's submission | Low | Critical | Test with two student accounts; verify submission list scoped to self |
| R9 | Admin token reuse on mobile app | Low | High | Verify mobile app JWT role check rejects ADMIN role |

### Runtime / UI Risks
| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R10 | Empty state shown where real data exists | High | Medium | Verify API returns non-null arrays; check with curl/Postman |
| R11 | Marks entry sticky footer clipping on small screens | Medium | Medium | Test on Pixel_8 emulator with soft keyboard open |
| R12 | Homework submission modal keyboard overlap | Medium | Medium | Test modal scroll behavior with keyboard open |
| R13 | Pull-to-refresh spinner stuck indefinitely | Low | Medium | Test on slow emulator network; add timeout assertion |
| R14 | Child context switch on Parent dashboard stale data | Medium | High | Switch children twice and verify all widgets update |
| R15 | Past exam dates hidden by default filter | High | Medium | Verify exam list shows past + future exams for teacher/student/parent |

---

## Automated Pre-UAT Checks

### 1. TypeScript Compilation
```bash
# Mobile
cd /Users/amroy/Desktop/ERP/mobile
npx tsc --noEmit

# Server
cd /Users/amroy/Desktop/ERP/server
npx tsc --noEmit

# Client (Web)
cd /Users/amroy/Desktop/ERP/client
npx tsc --noEmit
```
**Gate**: All three must pass with 0 errors before proceeding.

### 2. Server API Health Check
```bash
# Ensure server is running
curl -s http://localhost:3000/api/health || echo "Server not running"

# Test admin login
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"<ADMIN_PASSWORD>"}' | head -c 200
```

### 3. DB Integrity Quick Checks
```bash
mysql -u root '-p<DB_PASSWORD>' school_erp -e "
SELECT 'student_fee_orphans' as check_name,
  COUNT(*) as count FROM student_fees sf
  LEFT JOIN students s ON s.id=sf.studentId
  WHERE s.id IS NULL;
"

mysql -u root '-p<DB_PASSWORD>' school_erp -e "
SELECT 'parent_child_links' as check_name,
  COUNT(*) as count FROM parents p
  WHERE p.studentId IS NOT NULL;
"
```

### 4. Parity Audit Scripts
```bash
cd /Users/amroy/Desktop/ERP/server
npx ts-node --transpile-only scripts/audit-mobile-academic-parity.ts
```

---

## DB Backup Procedure

**MANDATORY before any write-heavy UAT test session (P2 flows)**:

```bash
# Step 1: Create timestamped backup
mysqldump -u root '-p<DB_PASSWORD>' school_erp > \
  /Users/amroy/Desktop/ERP/school_erp_uat_backup_$(date +%Y%m%d_%H%M%S).sql

# Step 2: Verify backup file was created and is non-zero
ls -lh /Users/amroy/Desktop/ERP/school_erp_uat_backup_*.sql | tail -1

# Step 3: Record backup filename in UAT execution log
echo "Backup created: $(ls -t /Users/amroy/Desktop/ERP/school_erp_uat_backup_*.sql | head -1)"
```

**Restore procedure if write test causes bad state**:
```bash
mysql -u root '-p<DB_PASSWORD>' school_erp < school_erp_uat_backup_<timestamp>.sql
```

---

## Bug Severity Classification

| Severity | Definition | Examples |
|---|---|---|
| **Critical** | System unusable or data corrupted | Login fails for all roles; fee balance shows wrong amount for all students |
| **High** | Core feature broken but workaround exists | Attendance submission returns 500; marks entry grid crashes |
| **Medium** | Feature degraded; non-core impact | Pull-to-refresh spinner stuck; past exams hidden by date filter |
| **Low** | Visual/cosmetic issue only | Minor alignment issue; wrong color on empty state icon |

---

## Bug Documentation Template
When a bug is found, document it as:

```
Bug ID: BUG-4-0-<number>
Phase: 4.0
Severity: Critical / High / Medium / Low
Platform: Web / Mobile Teacher / Mobile Student / Mobile Parent
Screen: <screen name>
Flow: <what was being done>
Real Data Used: <credential / record reference>
Expected: <what should happen>
Actual: <what happened>
DB Verification: <SQL query + result confirming state>
Screenshot: <path to screenshot if captured>
Status: Open / In Review / Fixed
```

---

## UAT Session Sequence (Recommended Order)

1. **Pre-UAT**: Run typechecks + DB backup
2. **Web Admin**: All P1 read flows first; then P2 write flows (notice, fee collection)
3. **Mobile Teacher**: Login + read flows; then P2 write (attendance, marks) after backup
4. **Mobile Student**: Login + all read flows; P2 write (homework submit)
5. **Mobile Parent**: All read flows; verify fee balance after web fee collection test
6. **Cross-Platform Sync**: Run sync matrix scenarios; verify DB state changes
7. **Role Isolation**: Test role boundaries with two logged-in accounts
8. **Post-UAT**: Run parity scripts; document all bugs; create execution report
