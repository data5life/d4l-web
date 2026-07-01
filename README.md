# D4L-Collect Web Interface

## Current Status (June 2026)

The web application is in a usable and actively developed state.

Working end-to-end flows:

- Authentication via NextAuth (magic link and Google OAuth)
- Program dashboard and program detail views
- Questionnaire rendering and submission (including iteration support)
- Submission retrieval and editing flow
- Data upload to the D4L dispatcher
- GDPR endpoints for account export and hard delete
- Outbound email to participants via the internal email API (queued dispatch through the mail worker and Resend)

---

## Getting Started

### Development

See [readme/DEVELOPMENT.md](readme/DEVELOPMENT.md)

This includes:

- Docker-based development environment
- database initialization
- local runtime setup

---

### Deployment

See [readme/DEPLOYMENT.md](readme/DEPLOYMENT.md)

This includes:

- production Docker Compose setup
- database persistence
- backups and restore procedures

---

## Documentation Map

- API endpoints: `readme/API.md`
- Database schema: `readme/DATABASE.md`
- FHIR + Questionnaire architecture: `readme/FHIRandQuestionnaireWizard.md`
- Questionnaire JSON format: `readme/questionareJSON.md`
- Testing: `readme/TESTING.md`

---

## Browser Support

Supported:

- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)

Not supported or not tested for support:

- iOS Safari (limited support)
- Chrome for Android

---

## License

This project is part of the Data4Life initiative.
