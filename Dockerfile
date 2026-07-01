# --- STAGE 1: DEPENDENCIES (shared) ---
FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

COPY .npmrc .npmrc
RUN --mount=type=secret,id=npm_token,env=NPM_TOKEN npm ci

COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm run db:generate

# --- STAGE 2: DEV ---
FROM node:22-bookworm-slim AS dev
WORKDIR /app

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

COPY . .
CMD ["npm", "run", "dev"]

# --- STAGE 3: BUILD ---
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

ARG SENSORHUB_URL
ENV SENSORHUB_URL=${SENSORHUB_URL}
ARG MOCK_DONATION_CLIENT
ENV NEXT_PUBLIC_MOCK_DONATION_CLIENT=${MOCK_DONATION_CLIENT}

ENV NEXT_PRIVATE_STANDALONE=true
RUN npm run build

# --- STAGE 4: MIGRATE ---
FROM node:22-bookworm-slim AS migrate
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY prisma/migrations ./prisma/migrations
COPY prisma.config.ts ./prisma.config.ts

ENV NODE_ENV=production
RUN mkdir -p /app/data && chown node:node /app/data
USER node

CMD ["npx", "prisma", "migrate", "deploy"]

# --- STAGE 5: PROD ---
FROM node:22-bookworm-slim AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]

# --- STAGE: SCRIPTS ----
FROM node:22-bookworm-slim AS scripts
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
ENV NODE_ENV=production
USER node

# --- STAGE: PLAYWRIGHT ---
FROM node:22-bookworm-slim AS playwright
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

RUN npx playwright install --with-deps

# COPY e2e e2e
# COPY e2e e2e
COPY . .
CMD ["npx", "playwright", "test"]

# --- STAGE: TEST-UNIT ---
FROM node:22-bookworm-slim AS test-unit
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

CMD ["sh", "-c", "npm run validate && npm test"]
