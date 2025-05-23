# Etapa 1 - Build do cliente

FROM node:18-alpine AS cliente-build

WORKDIR /app



# Instalar pnpm

RUN npm install -g pnpm



# Copiar arquivos principais do monorepo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY apps/cliente ./apps/cliente

COPY apps/server ./apps/server



# Instalar dependências

RUN pnpm install



# Build do cliente

WORKDIR /app/apps/cliente

RUN pnpm build



# Etapa 2 - Final

FROM node:18-alpine

WORKDIR /app



# Instalar pnpm

RUN npm install -g pnpm



# Instalar bash para script de inicialização

RUN apk add --no-cache bash



# Copiar arquivos principais

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./



# Copiar server e build do cliente

COPY apps/server ./apps/server

COPY --from=cliente-build /app/apps/cliente/dist ./apps/server/public/build



# Copiar banco SQLite (opcional)

COPY ./database.sqlite ./apps/server/



# Copiar script de inicialização

COPY start.sh .



# Instalar dependências de produção do server

WORKDIR /app/apps/server

RUN pnpm install --prod



# Prisma (ajustável)

ENV DATABASE_URL="file:./database.sqlite"

RUN apk add --no-cache openssl

RUN npx prisma generate && npx prisma migrate deploy



# Variáveis de ambiente

ENV NODE_ENV=production



# Expor a porta

EXPOSE 3000

EXPOSE 3001



# Iniciar ambos (frontend e backend)

CMD ["bash", "/app/start.sh"]