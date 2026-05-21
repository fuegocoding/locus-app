# Locus Database Production Deployment Guide (Railway & Prisma)

This guide provides a frictionless, step-by-step workflow for deploying and configuring the Locus database layer on **Railway**. 

Locus uses a two-tier data architecture:
1. **PostgreSQL** (via **Prisma ORM**): For persistent user accounts, profiles, followers/friends, and convoy invitation records.
2. **Redis** (via **ioredis**): For real-time proximity math, user tracking, and active convoy presence.

---

## 1. System Architecture

```mermaid
graph TD
    Client[Flutter Mobile/Web App] -->|HTTPS & Socket.io| Server[Express Node.js Server]
    Server -->|Queries| Postgres[(PostgreSQL Service)]
    Server -->|Key-Value / PubSub| Redis[(Redis / Upstash Service)]
    Server -->|JWT Verification| Postgres
    Server -->|WebRTC Coordination| LiveKit[LiveKit Cloud API]
```

---

## 2. Step-by-Step Deployment Flow

### Step 2.1: Provision PostgreSQL on Railway
1. Navigate to your **Railway Project Dashboard**.
2. Click **New** (or press `Ctrl + K`) → **Database** → **Add PostgreSQL**.
3. Railway will provision the PostgreSQL database instance.
4. Click on the newly created **PostgreSQL** service → **Variables** to find your database connection credentials. Railway automatically generates a dynamic `DATABASE_URL` variable.

### Step 2.2: Provision Redis on Railway
Proximity tracking requires Redis to run. You can choose either:
- **Upstash Redis** (Recommended: Serverless & scale-safe):
  1. In the Railway dashboard, click **New** → **Database** → **Upstash Redis**.
  2. Copy the connection string.
- **Railway Redis**:
  1. Click **New** → **Database** → **Add Redis**.
  2. Copy the connection string.

### Step 2.3: Bind Database URLs to the Server Service
1. Click on the **Server Service** card in your Railway project dashboard.
2. Go to **Settings** → **Variables**.
3. Click **New Variable** and add:
   * **`DATABASE_URL`**: Reference the PostgreSQL service dynamically by entering `${{ Postgres.DATABASE_URL }}` (or the corresponding name of your database service).
   * **`REDIS_URL`**: Reference the Redis service dynamically by entering `${{ Redis.REDIS_URL }}` (or Upstash Redis url).
4. Save the variables. Railway will automatically trigger a redeploy of the server using the new credentials.

---

## 3. Production Container Integration (`Dockerfile`)

To support Prisma Client generation and code bundling inside the Docker image during deployments, the `server/Dockerfile` is configured to copy your schema files and compile the Prisma Client in both the build and run phases:

```dockerfile
# --- Builder Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci

# Copy the Prisma schema and config to generate client
COPY server/prisma/ ./prisma/
COPY server/prisma.config.ts ./
RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src/ ./src/
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./

# Production dependencies need the prisma client generation too
COPY server/prisma/ ./prisma/
COPY server/prisma.config.ts ./
RUN npm ci --only=production && npx prisma generate

COPY --from=builder /app/dist ./dist

# Copy Flutter web build
COPY app/build/web /app/build/web
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

---

## 4. Applying Schema Migrations to Production

When you update `schema.prisma` locally, you need the production database to reflect those changes. Choose one of the following strategies:

### Option A: Auto-Sync on Launch (Recommended for MVP / Testing)
You can command Prisma to automatically update the schema whenever the Docker container starts up.
1. In the **Railway Dashboard** → Click your **Server Service**.
2. Go to **Settings** → **Deploy** → **Start Command**.
3. Set the command to:
   ```bash
   npx prisma db push && node dist/index.js
   ```
* **Why use this?**: Fast iterations. You don't need to generate or commit migration files.

### Option B: Prisma Migrations (Recommended for Production)
If you want to maintain a clean audit history of your database alterations:
1. Generate the migration files locally using your local Dev database:
   ```bash
   npx prisma migrate dev --name add_social_relations
   ```
2. Commit the generated `server/prisma/migrations` folder to Git.
3. Update the **Start Command** in the Railway Server settings to:
   ```bash
   npx prisma migrate deploy && node dist/index.js
   ```

---

## 5. CLI Cheat Sheet (Troubleshooting & Operations)

Make database management easier by leveraging the Railway CLI:

### Pushing Schema directly to Production via CLI (For Testing)
If you want to push schema updates directly from your terminal to the production database without building a new Docker container:
```bash
# Move to server directory
cd server

# Run db push with production context
railway run npx prisma db push
```

### Inspecting Production Data via Prisma Studio
You can view, edit, and search database records in a web UI connected directly to your Railway production database:
```bash
cd server
railway run npx prisma studio
```
*This opens a browser tab at `http://localhost:5555` connected securely to your live Railway database.*

---

## 6. Verification and Troubleshooting

### 1. Verification Health Check
Make an HTTP request to the health endpoint to confirm Postgres and Redis are fully online:
```bash
curl https://YOUR_RAILWAY_DOMAIN.up.railway.app/health
```
**Expected Output:**
```json
{
  "status": "ok",
  "uptime": 123.45,
  "environment": "production",
  "services": {
    "redis": "connected"
  }
}
```

### 2. Common Errors
* **`Prisma Client has not been generated yet`**: Make sure the `npx prisma generate` command is in your `Dockerfile` (see Section 3) and that your build context is correct.
* **SSL Connection Error**: If you see PostgreSQL connection errors on startup, add SSL options to your `DATABASE_URL` in Railway:
  ```
  postgresql://postgres:password@host:port/db?sslmode=no-verify
  ```
* **Database Pool Timeout**: If the server hits database limits, configure your connection pool size in `DATABASE_URL` by appending `&connection_limit=10`.
