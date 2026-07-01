# Deployment Guide

## Overview

The application is deployed using Docker Compose.

It runs:

- database migration step
- production Next.js server
- persistent database volume (`next_db_data`)

---

## 1. Start Production

```bash
docker compose -f docker-compose_prod.yml up -d
```

This will:

- run database migrations
- build and start the production Next.js application
- persist data using the `next_db_data` volume
- run the `scheduler` and the `mail-worker`

---

## 2. Environment Variables

Create an environment file in the project root.

Next.js supports `.env.local` in production builds.

```env
AUTH_URL=https://your-domain.com
DATABASE_URL="file:/app/data/prod.db"

AUTH_SECRET=your-generated-secret-here

# Email (Resend)
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-resend-api-key
EMAIL_FROM=your-verified-email@your-domain.com

NEXT_PUBLIC_D4L_DISPATCHER_SECRET=the-d4l-dispatcher-secret
SENSORHUB_URL=the-sensorhub-base-url

# Google OAuth (optional)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

INTERNAL_EMAIL_SECRET=your-shared-email-secret
```

Additionally create a `.env` with the following contents:

```env
NPM_TOKEN=the-d4l-token
SENSORHUB_URL=the-sensorhub-base-url
```

For more informations on how to setup the enviroment variables check out
[DEVELOPMENT.md](./DEVELOPMENT.md#2-create-environment-variables)

---

## 3. Port Configuration

Default port: `3000`

Override via environment variable in the `.env`:

```env
APP_PORT=8080
```

Or inline:

```bash
APP_PORT=8080 docker compose -f docker-compose_prod.yml up -d
```

---

## 4. Lifecycle Management

```bash
# View logs
docker compose -f docker-compose_prod.yml logs -f web

# Restart service
docker compose -f docker-compose_prod.yml restart web

# Stop stack
docker compose -f docker-compose_prod.yml down

# Start again
docker compose -f docker-compose_prod.yml up -d
```

---

## 5. Database Backups

The database is stored in the Docker volume `next_db_data`.

### Backup

```bash
docker run --rm -v d4l-web_next_db_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/prod.db.tar.gz -C /data .
```

### Restore

```bash
docker run --rm -v d4l-web_next_db_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/prod.db.tar.gz -C /data
```
