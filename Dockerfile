# Estágio de construção
FROM node:20-alpine AS builder

# Instala dependências do sistema necessárias para o Prisma
RUN apk add --no-cache openssl openssl-dev lz4-libs lz4-dev musl-dev

WORKDIR /app

# Copiar arquivos de configuração
COPY server/package*.json ./
COPY server/prisma ./prisma/

# Instalar dependências
RUN npm install

# Copiar o restante da aplicação
COPY server .

# Gerar cliente do Prisma
RUN npx prisma generate

# Estágio de produção
FROM node:20-alpine

# Instala dependências do sistema necessárias para o Prisma
RUN apk add --no-cache openssl lz4-libs

WORKDIR /app

# Copiar o necessário do estágio builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src

# Criar diretório para o banco de dados
RUN mkdir -p ./database && \
    chown -R node:node /app && \
    chmod -R 755 /app

# Definir variáveis de ambiente padrão
ENV PORT=3001 \
    DATABASE_URL="file:/app/database/database.sqlite" \
    NODE_ENV="production"

# Criar script de inicialização diretamente no estágio de produção
RUN echo '#!/bin/sh\n\
echo "Executando migrations do Prisma..."\n\
npx prisma migrate deploy\n\
echo "Iniciando o servidor..."\n\
npm start\n\
' > /app/start.sh && \
chmod +x /app/start.sh

USER node

EXPOSE 3001

CMD ["/bin/sh", "/app/start.sh"]
