# =========================
# Stage 1 — Build
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Gera Prisma Client para build
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

# Copia schema e migrations
COPY --from=builder /app/prisma ./prisma

# Copia build
COPY --from=builder /app/dist ./dist

# 🔥 GERA O PRISMA CLIENT NO CONTAINER FINAL
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "node dist/main.js"]