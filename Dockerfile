# Estágio de construção
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Gerar cliente do Prisma
RUN npx prisma generate

# Estágio de produção
FROM node:20-alpine

WORKDIR /app

# Copiar apenas o necessário do estágio de construção
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/.env ./

# Garantir que o diretório do banco de dados existe
RUN mkdir -p ./database && touch ./database/database.sqlite

# Expor a porta da aplicação
EXPOSE 3001

# Comando de inicialização
CMD ["npm", "start"]