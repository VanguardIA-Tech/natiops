# =========================
# Stage 1 — Build
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# ✅ schema sem url => generate funciona
RUN npx prisma generate

COPY . .
RUN npm run build


# =========================
# Stage 2 — Production
# =========================
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# ✅ gera client no container final (sem precisar do prisma.config.ts no build)
RUN npx prisma generate

# ✅ MUITO IMPORTANTE: agora sim copiar o config do Prisma v7
COPY prisma.config.ts ./prisma.config.ts

EXPOSE 3000

# ✅ roda migrations no runtime (agora o prisma.config.ts existe!)
CMD ["sh", "-c", "npx prisma migrate deploy --config ./prisma.config.ts && node dist/main.js"]
