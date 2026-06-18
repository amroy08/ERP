# Phase 4.0: DB Backup Procedure

## Purpose
This document defines the mandatory database backup procedure that must be executed before any
write-heavy UAT test session. This protects real data from unintended modification during UAT.

---

## When to Backup
Take a fresh backup **before** running any of these P2 write flows:
- Fee collection via Web Admin
- Notice creation via Web Admin
- Teacher attendance submission via Mobile
- Teacher marks submission via Mobile
- Student homework submission via Mobile

---

## Backup Command

```bash
# Navigate to ERP root
cd /Users/amroy/Desktop/ERP

# Create timestamped backup (excludes local-builds and test artifacts)
mysqldump -u root '-pAmroy@123' school_erp > school_erp_uat_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file was created and is non-zero
ls -lh school_erp_uat_backup_*.sql | tail -1
```

**Expected output**: A `.sql` file ~500KB–1MB (current DB is ~554KB from previous export)

---

## Verify Backup Integrity

```bash
# Check line count (should be many thousands of lines)
wc -l school_erp_uat_backup_$(date +%Y%m%d).sql

# Quick sanity: confirm students table present in dump
grep "INSERT INTO \`students\`" school_erp_uat_backup_*.sql | head -1
```

---

## Restore Procedure

If a write-heavy UAT step causes an unintended data state, restore with:

```bash
# Step 1: Stop all active server connections if possible
# Step 2: Restore
mysql -u root '-pAmroy@123' school_erp < school_erp_uat_backup_<TIMESTAMP>.sql

# Step 3: Verify count is back to expected
mysql -u root '-pAmroy@123' school_erp -e "SELECT COUNT(*) FROM students;"
# Expected: 274
mysql -u root '-pAmroy@123' school_erp -e "SELECT COUNT(*) FROM student_fees;"
# Expected: 805
```

---

## Backup File Location
Backups should be stored at:
```
/Users/amroy/Desktop/ERP/school_erp_uat_backup_<YYYYMMDD_HHMMSS>.sql
```

> **Note**: Backup files must NOT be committed to git (already covered by `.gitignore`).
> Verify `.gitignore` includes `*.sql` or the specific backup filename pattern.

---

## .gitignore Verification

```bash
cd /Users/amroy/Desktop/ERP
cat .gitignore | grep -E "sql|backup"
```

If `*.sql` is not in `.gitignore`, add it before taking the backup:
```bash
echo "*.sql" >> .gitignore
```

---

## Backup Log

Record each backup taken during UAT execution here:

| Backup File | Created At | Reason | Created By |
|---|---|---|---|
| *(fill in during execution)* | | | |
