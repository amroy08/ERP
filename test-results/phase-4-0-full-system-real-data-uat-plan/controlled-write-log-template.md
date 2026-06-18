# Phase 4.0: Controlled Write Log Template

## Purpose
Every write operation performed against the live `school_erp` database during UAT execution must be
logged here before and after the operation. This log serves as the audit trail for all data
modifications made during Phase 4.0 UAT.

> **Rule**: Log the entry BEFORE performing the write. Fill in the "after" fields immediately once
> the operation completes. If rollback is needed, document the rollback action and result.

---

## Pre-Conditions Before Any Write

- [ ] DB backup exists: `school_erp_uat_backup_<TIMESTAMP>.sql`
- [ ] Backup file size confirmed non-zero
- [ ] Action approved as P2 write flow per `uat-scope.md`

---

## Write Log Entries

### Entry Template (copy and fill for each write operation)

```
────────────────────────────────────────────────────────────────
Write Entry #: <number>
────────────────────────────────────────────────────────────────
Date/Time          : YYYY-MM-DD HH:MM:SS (IST)
Tester             : <tester name>
Environment        : local / staging / UAT copy
Database           : school_erp (live) / school_erp_uat_copy
Backup taken before: Yes / No — <backup filename>

Module             : Web Admin / Mobile Teacher / Mobile Student / Mobile Parent
Screen             : <screen name>
Action performed   : <description of what was written — e.g. "Submitted attendance for Class 1-A">

Record type        : attendance / marks / homework_submission / fee_payment / notice
Record ID before   : <entity ID if updating existing row, or "NEW" if creating>
Record ID after    : <entity ID of newly created/updated row>

Old value          : <field name>: <old value> (or "N/A" if new creation)
New value          : <field name>: <new value>

API endpoint       : POST/PUT/PATCH <url>
HTTP response code : 200 / 201 / 400 / 500
Server response    : <brief summary of response body>

DB verification    : SELECT <query> → <result confirming write succeeded>

Rollback needed    : Yes / No
Rollback reason    : <if Yes — why>
Rollback method    : Restore from backup: school_erp_uat_backup_<TIMESTAMP>.sql
Rollback performed : Yes / No / N/A
Rollback verified  : Yes / No / N/A

Verified on web    : Yes / No / N/A — <notes>
Verified on mobile : Yes / No / N/A — <notes>

Cross-platform sync: Data appeared on target platform within <N> seconds of pull-to-refresh
Sync matched       : Yes / No / N/A

Notes              : <any anomalies, warnings, or follow-up actions>
────────────────────────────────────────────────────────────────
```

---

## Write Flows Expected in Phase 4.0 Execution

The following P2 write flows have been pre-approved per `uat-scope.md`. Each must have an entry above.

| # | Flow | Platform | Rollback Risk |
|---|---|---|---|
| W-01 | Fee collection — partial payment for test student | Web Admin | Medium — balance change |
| W-02 | Notice creation — audience=ALL | Web Admin | Low — notice can be deleted |
| W-03 | Teacher attendance submit — Class 1-A present | Mobile Teacher | Low — idempotent if re-marked |
| W-04 | Teacher marks entry — First Term Exam, 1–2 students | Mobile Teacher | Medium — overwrites results |
| W-05 | Teacher homework review — remark submission | Mobile Teacher | Low — remark update |
| W-06 | Student homework submission — text response | Mobile Student | Low — new submission |

---

## Completed Write Log

*(Fill during Phase 4.0 UAT execution — leave blank during planning phase)*

| Entry # | Date/Time | Module | Action | Record ID | Rollback Needed |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

---

## Rollback Summary

*(Fill if any rollback was performed)*

| Entry # | Rollback Performed | Backup File Used | Verified |
|---|---|---|---|
| — | — | — | — |
