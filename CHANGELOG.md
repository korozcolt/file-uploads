# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]
### Added
- Swagger/OpenAPI documentation available at `/docs` and `/docs.json` (`src/docs/openapi.json`).
- `scripts/seed-admin.js` script to seed an admin user with a hashed password.
- DB user support (SQLite + JSON fallback) and login integration to support hashed passwords.
- Tests for documentation endpoints and auth seed flow (`tests/docs.test.ts`, `tests/auth-seed.test.ts`).

### Changed
- Removed hard-coded admin password in tests; tests use `TEST_ADMIN_PASSWORD` env var or generated password.
- `auth` route now checks DB users (bcrypt-hashed) before falling back to environment variables.

### Security
- Avoid committing plaintext passwords; tests now generate random values or read from env.


## [2026-01-03] - main
### Added
- Initial upload, project, and images endpoints with validation, storage, and signed URL functionality.
- CI: GitHub Actions workflow for test and deploy.
- Scripts and deployment artifacts (`deploy/`, `scripts/setup-server.sh`).


---

**Notes:**
- This changelog is terse; see `DELIVERY.md` for full documentation and integration instructions.
