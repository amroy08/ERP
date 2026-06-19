# Scheduler Activation Notes

## Configuration Policy

- **Disabled by default**: The automatic daily scanner interval does not run unless the environment variable `ENABLE_NOTIFICATION_SCHEDULER=true` is set.
- **Safety checks**: The background scanner hook is gated to never register or run when `NODE_ENV=test`.
- **Deduplication**: Stores a marker on `global` to prevent duplicate interval registrations if the server reloads.
- **Privacy protection**: Startup background log outputs print only metrics and summaries, ensuring no personal identifiable information (PII), student details, or fee balances are logged.
