# =========================
# Stage 1 — Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# 🔥 OBRIGATÓRIO: gerar Prisma Client antes do tsc
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
COPY prisma ./prisma/

RUN npm install --omit=dev

# 🔥 gerar novamente no runtime (DB pode mudar)
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]