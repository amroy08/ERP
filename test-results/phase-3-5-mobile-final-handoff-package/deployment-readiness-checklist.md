# Deployment Readiness Checklist — Phase 3.5

The following checklist should be followed in a future release build cycle before executing production APK/AAB builds:

### 1. Configuration Checklists
- [ ] **Confirm environment variables**: Verify `.env` parameters for the deployment environment.
- [ ] **Confirm API base URL**: Check backend endpoint URL maps (HTTPS in production).
- [ ] **Confirm demo/test users**: Clear mock credentials or seed data if preparing for public releases.
- [ ] **Confirm Android package/signing config**: Verify `eas.json` profiles, keystore parameters, and credentials.
- [ ] **Confirm Firebase/google-services**: Ensure `google-services.json` file configurations are placed (if firebase cloud messaging/notifications are enabled).

### 2. Validation Checklists
- [ ] **Run full typechecks**: Execute typescript compilation checks inside `mobile`, `server`, and `client` workspaces to confirm zero errors.
- [ ] **Run server regression scripts**: Audit backend visibility and syncing constraints using the parity scripts suite in `server`.
- [ ] **Run fresh emulator smoke tests**: Complete a quick UAT sweep on the target build package.

### 3. Build Checklist
- [ ] **Create APK/AAB in dedicated build phase**: Execute `eas build --platform android` or local gradle commands only inside a dedicated release phase.
