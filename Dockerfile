# =========================
# Stage 1 — Build
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copia apenas o necessário para instalar deps (melhora cache)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Agora copia o restante do código
COPY . .

# Gera Prisma Client e builda o TS
RUN npx prisma generate
RUN npm run build


# =========================
# Stage 2 — Production
# =========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copia apenas o necessário para runtime
COPY package*.json ./
COPY prisma ./prisma/

# Instala só dependências de produção
RUN npm install --omit=dev

# Copia Prisma Client já gerado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copia o JS compilado
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Roda migrations e sobe a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
