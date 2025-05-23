# Guia de Implantação do Backend no EasyPanel

Este documento explica como implantar o backend do site de casamento no EasyPanel usando o Dockerfile fornecido.

## Sobre o Dockerfile

O Dockerfile melhorado para o backend está configurado para:

1. Construir a aplicação Node.js com todas as dependências necessárias
2. Configurar o Prisma ORM para acesso ao banco de dados SQLite
3. Executar migrations automaticamente na inicialização
4. Garantir permissões adequadas e segurança

## Passos para Implantação no EasyPanel

### 1. Preparação

Certifique-se de que:
- Você tem acesso ao painel do EasyPanel
- O repositório Git está acessível ao EasyPanel (público ou com credenciais configuradas)

### 2. Criação do Serviço no EasyPanel

1. Acesse o painel do EasyPanel
2. Clique em "Novo Serviço" ou "Adicionar Serviço"
3. Selecione "Aplicação Web" ou "Aplicação Personalizada"

### 3. Configuração do Serviço

Configure o serviço com as seguintes informações:

- **Nome do Serviço**: casamento-site-backend (ou outro nome de sua preferência)
- **Método de Implantação**: Git
- **Repositório Git**: https://github.com/hosanah/casamento-site-api.git
- **Branch**: main (ou a branch que deseja implantar)
- **Dockerfile Path**: ./Dockerfile (ou ./Dockerfile.improved se você renomeou o arquivo)
- **Porta Exposta**: 3001 (já configurada no Dockerfile)

### 4. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente:

- `DATABASE_URL`: Por padrão, usa SQLite local em "file:../database/database.sqlite". Para usar outro banco:
  - MySQL: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`
  - PostgreSQL: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- `JWT_SECRET`: Chave secreta para geração de tokens JWT (use uma string aleatória e segura)
- `PORT`: 3001 (já definido no Dockerfile, altere apenas se necessário)
- `NODE_ENV`: "production" (já definido no Dockerfile)

### 5. Volumes Persistentes (Importante)

Configure um volume persistente para o diretório do banco de dados:

- **Caminho no Container**: /app/database
- **Descrição**: Banco de dados SQLite

Isso garantirá que seus dados sejam preservados mesmo se o container for reiniciado.

### 6. Recursos (Recomendado)

Recomendações de recursos para o serviço:
- **CPU**: 0.5-1 vCPU
- **Memória**: 512MB-1GB
- **Armazenamento**: 1GB (mais se você espera muitos uploads)

### 7. Implantação

1. Clique em "Criar" ou "Implantar"
2. O EasyPanel irá clonar o repositório e construir a imagem Docker
3. Após a conclusão do build, o serviço estará disponível na URL fornecida pelo EasyPanel

## Migrations do Banco de Dados

O Dockerfile melhorado executa automaticamente as migrations do Prisma na inicialização do container. Isso garante que o esquema do banco de dados esteja sempre atualizado.

Se você precisar executar migrations manualmente:

```bash
# Acesse o terminal do container no EasyPanel e execute:
npx prisma migrate deploy
```

## Atualizações

Para atualizar o backend após alterações no código:

1. Envie as alterações para o repositório Git
2. No EasyPanel, acesse o serviço e clique em "Reimplantar" ou "Reconstruir"

## Solução de Problemas

Se encontrar problemas durante a implantação:

1. Verifique os logs de build e execução no EasyPanel
2. Certifique-se de que todas as variáveis de ambiente necessárias estão configuradas
3. Verifique se o volume persistente para o banco de dados está configurado corretamente
4. Se necessário, acesse o terminal do container para depuração

## Notas Adicionais

- O backend usa SQLite por padrão, o que é adequado para sites de baixo a médio tráfego
- Para sites com alto tráfego, considere configurar um banco de dados externo (MySQL/PostgreSQL)
- O Dockerfile está configurado para executar como usuário não-root (node) por segurança
- As migrations são executadas automaticamente na inicialização do container
