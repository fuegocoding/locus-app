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
