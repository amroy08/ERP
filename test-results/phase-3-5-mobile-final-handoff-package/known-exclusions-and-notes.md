# Known Exclusions and Notes — Phase 3.5

The following constraints, design parameters, and file status notes apply to the mobile frontend work package:

### 1. Build and Release Artifacts Exclusions
* **No APK or EAS builds** were run during these phases. Releasing final production packages remains an independent operations step.
* All `local-builds/` folders and test preview artifacts are untracked and excluded from this handoff package.

### 2. Backend & Web Console Integrity
* **No backend API routing or model updates** were made. The UI premium redesign utilizes existing endpoints.
* **No Prisma schema modifications** or migrations were created.
* **No web console interface code changes** were performed; web views remain stable on the main branch.

### 3. Local File Exclusions
* The file [AdmissionFormPage.tsx](file:///Users/amroy/Desktop/ERP/client/src/features/admissions/AdmissionFormPage.tsx) is a local unstaged file and was explicitly excluded from staging and commits.
* Local development environment overrides (`.env`), database logs, and adb dumps remain ignored.
