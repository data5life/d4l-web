# Internal API Endpoints

This document describes the internal Next.js API routes implemented in `app/api`.

All endpoints are part of the web app backend and are not intended as a public, versioned external API.

## Notes

- Authentication is session-based (NextAuth).
- Most routes require an authenticated user.
- Response payloads are not fully standardized yet.

## Endpoint Overview

### Authentication

- `GET, POST /api/auth/[...nextauth]`
  - NextAuth route handlers (login, callback, session-related flows).
  - Used for magic link and Google OAuth authentication.

### Dashboard

- `GET, POST, DELETE /api/dashboard/programs/[programId]/enrollment`
  - Gets the enrollment information for a specific user and a specific user
  - Auth required

### User / GDPR

- `GET /api/user/export`
  - Exports the authenticated user's data in JSON format.
  - Auth required.

- `DELETE /api/user`
  - Permanently deletes the authenticated user account and associated data.
  - Auth required.
  - Requires explicit confirmation payload.

- `POST /api/user/complete-onboarding`
  - Used to submit the initial user information to complete the onboarding process

### SensorHub Proxy

- `XXX /api/sensorhub/[...slug]`
  - Proxies all requests to SensorHub.
  - Used to fetch program/questionnaire definitions and upload resources while avoiding CORS issues.
