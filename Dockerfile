FROM node:20-alpine AS base

# -- Stage 1: Install deps --
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# -- Stage 2: Build --
FROM base AS builder
RUN apk add --no-cache libc6-compat chromium
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time NEXT_PUBLIC_ vars (injected via docker build --build-arg from GitHub Actions)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_NETCASH_SERVICE_KEY
ARG NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY
ARG NEXT_PUBLIC_DIDIT_ENVIRONMENT
ARG NEXT_PUBLIC_ICASA_ENVIRONMENT

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    NEXT_PUBLIC_NETCASH_SERVICE_KEY=$NEXT_PUBLIC_NETCASH_SERVICE_KEY \
    NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY=$NEXT_PUBLIC_NETCASH_PCI_VAULT_KEY \
    NEXT_PUBLIC_DIDIT_ENVIRONMENT=$NEXT_PUBLIC_DIDIT_ENVIRONMENT \
    NEXT_PUBLIC_ICASA_ENVIRONMENT=$NEXT_PUBLIC_ICASA_ENVIRONMENT \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_OPTIONS='--max-old-space-size=5632'

# cpus:1 in next.config.js limits webpack to 1 worker (~1GB).
# 5632MB heap + 1GB worker + ~1GB Docker/OS = ~7.5GB — fits GitHub Actions 7GB runner.
# If this OOMs, bump runner to ubuntu-latest-16-core (64GB) in deploy.yml.
RUN npm run build

# -- Stage 3: Runner --
FROM base AS runner

# Chromium runtime deps for Puppeteer/headless browser
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-cjk

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# 254-page app needs 90-120s cold start — use generous start-period
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
