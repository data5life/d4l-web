# Development Guide

## Overview

This guide explains how to run the project in a local development environment.

The application runs fully containerized using VS Code Dev Containers or DevPod.

## Prerequisites

- **Docker Desktop** (includes Docker Engine & Docker Compose)
  - [Download](https://www.docker.com/products/docker-desktop)
  - Verify: `docker --version` & `docker compose --version`

- **VS Code** + Dev Containers extension
  - Extension: `ms-vscode-remote.remote-containers`
  - [Install Guide](https://code.visualstudio.com/docs/devcontainers/tutorial)

> [DevPod](https://devpod.sh/) is also supported as an alternative container runtime,
> but this guide focuses on VS Code Dev Containers.

---

### 1. Clone Repository

```bash
git clone https://github.com/ST3F4NX/d4l-web.git
cd d4l-web
git switch dev
```

> [!TIP]  
> **Switching Branches:** When switching between branches, it is highly
> recommended to delete the `.next` folder to avoid cache conflicts and
> build errors:
>
> ```bash
> rm -rf .next
> ```
>
> If packages have changed between branches, it's also recommended to
> restart the dev container to ensure all dependencies are installed correctly.

---

### 2. Create Environment Variables

Create `.env.local` **before building the container**:

```bash
touch .env.local
```

```env
AUTH_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"

# Generate AUTH_SECRET with openssl
AUTH_SECRET=your-generated-secret-here

# Email (magic link auth) — see Email Setup below
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=your-resend-api-key
EMAIL_FROM=onboarding@resend.dev

NEXT_PUBLIC_D4L_DISPATCHER_SECRET=the-d4l-dispatcher-secret
SENSORHUB_URL=the-sensorhub-base-url


# Google OAuth — see Google Setup below
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Generate INTERNAL_EMAIL_SECRET with openssl
INTERNAL_EMAIL_SECRET=your-second-generated-secret
```

#### Generate AUTH_SECRET and INTERNAL_EMAIL_SECRET

```bash
openssl rand -base64 32
```

Copy the output into `AUTH_SECRET=...` in `.env.local`.
Generate another secret and copy that into `INTERNAL_EMAIL_SECRET=...` in `.env.local`.

#### Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com/onboarding)
2. Create an API key and set it as `EMAIL_SERVER_PASSWORD`
3. Note: Resend only delivers to the email address used to create your account (in test mode)

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → APIs & Services → Credentials → OAuth 2.0 Client ID
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
4. Copy the Client ID and Secret into `.env.local`

---

### 3. Configure NPM Auth Token

To install the private `@d4l/collect-lib` package, add your npm auth token to `.env`:

```env
NPM_TOKEN=the-d4l-token
```

---

### 4. Build the Dev Container Image

Before opening the project in VS Code, build the dev image manually:

```bash
docker compose build
```

This builds the `dev` target from the Dockerfile. This takes 3-5 minutes on first run.

> [!TIP]  
> **Free up disk space:** Over time, Docker accumulates dangling (unnamed) volumes that waste disk space.
> Before rebuilding, it's worth checking and cleaning them up:
>
> ```bash
> # List dangling volumes
> docker volume ls -f dangling=true
>
> # Remove all dangling volumes
> docker volume prune
> ```

### 5. Open in Dev Container (VS Code)

Open the project folder in VS Code. A popup should appear asking to **"Reopen in Container"** — click it.

> If no popup: `Ctrl/Cmd + Shift + P` → "Dev Containers: Reopen in Container"

The dev container will:

- Mount your local code into the container
- Install dependencies
- Run `npm run db:push` to set up the database

---

### 6. Run the Dev Server

Once the container is ready (terminal should be available), the app starts automatically.
Open [http://localhost:3000](http://localhost:3000).

To stop: `Ctrl/Cmd + C` in the terminal, or close the container.

---

### 7. Run the service workers

To schedule email notifications you have to start the sheduler service with:

```bash
export $(grep -v '^#' .env.local | xargs) && npx tsx --tsconfig tsconfig.scripts.json scripts/scheduler.ts
```

To send emails from the email job queue you have to start the mail worker with:

```bash
export $(grep -v '^#' .env.local | xargs) && npx tsx --tsconfig tsconfig.scripts.json scripts/mail-worker.ts
```

---

### 8. Useful Commands (in container terminal)

```bash
# View the database
npm run db:studio

# Check database schema
npx prisma db pull

# Sync schema changes
npm run db:push

# Generate Prisma client manually
npm run db:generate

# Before opening a PR, ensure this command passes without errors:
npm run validate
# This runs:
#  - lint
#  - format:check
#  - type-check
#  - knip

# Also ensure that all tests are passing
npm run test:all
```

---

### 8. Package Management

When installing a new package, use the `--os` and `--cpu` flags to ensure the lockfile is compatible with the Linux container:

```bash
npm install  --os=linux --cpu=x64 --cpu=arm64
```

If the `package-lock.json` needs to be fully regenerated (e.g. after a merge conflict), run this outside the container:

```bash
docker run --rm -v "$PWD":/app -w /app node:22-bookworm-slim sh -c "\
  rm -rf node_modules package-lock.json && \
  NPM_TOKEN=INSERT_TOKEN_HERE npm install --package-lock-only --os=linux --cpu=x64 --cpu=arm64\
"
```

Replace `INSERT_TOKEN_HERE` with your npm auth token from `.env`.

---

### 9. Example Questionnaires

Navigate to these URLs to test:

- http://localhost:3000/dashboard/program/demo-bp
- http://localhost:3000/dashboard/program/wiederkehrend
- http://localhost:3000/dashboard/program/deng
- http://localhost:3000/dashboard/program/flow2
