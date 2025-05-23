# Guia de Implantação do Backend no EasyPanel

Este documento explica como implantar o backend do site de casamento no EasyPanel usando o Dockerfile fornecido.

## Sobre o Dockerfile

O Dockerfile corrigido para o backend está configurado para:

1. Construir a aplicação Node.js com todas as dependências necessárias
2. Configurar o Prisma ORM para acesso ao banco de dados SQLite
3. Executar migrations automaticamente na inicialização
4. Garantir permissões adequadas e segurança
5. **Usar caminhos absolutos** para o banco de dados SQLite

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
- **Dockerfile Path**: ./Dockerfile.fixed (importante usar o arquivo corrigido)
- **Porta Exposta**: 3001 (já configurada no Dockerfile)

### 4. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente:

- `DATABASE_URL`: Já definido como "file:/app/database/database.sqlite" no Dockerfile
  - Para usar outro banco:
    - MySQL: `mysql://USER:PASSWORD@HOST:PORT/DATABASE`
    - PostgreSQL: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`
- `JWT_SECRET`: Chave secreta para geração de tokens JWT (use uma string aleatória e segura)
- `PORT`: 3001 (já definido no Dockerfile, altere apenas se necessário)
- `NODE_ENV`: "production" (já definido no Dockerfile)

### 5. Volumes Persistentes (CRÍTICO)

**IMPORTANTE**: Configure um volume persistente para o diretório do banco de dados:

- **Caminho no Container**: /app/database
- **Descrição**: Banco de dados SQLite

Isso é **absolutamente essencial** para que seus dados sejam preservados. Sem este volume, todos os dados serão perdidos quando o container for reiniciado.

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

O Dockerfile corrigido executa automaticamente as migrations do Prisma na inicialização do container. Isso garante que o esquema do banco de dados esteja sempre atualizado.

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

1. **Problema com o banco de dados**: Verifique se o volume persistente para `/app/database` está configurado corretamente
2. **Erro de permissão**: Verifique se o usuário `node` tem permissões de escrita no diretório do banco de dados
3. **Migrations falhando**: Acesse o terminal do container e execute `npx prisma migrate deploy` manualmente para ver erros detalhados
4. **Container encerrando**: Verifique os logs para identificar possíveis erros de inicialização

## Notas Adicionais

- O backend usa SQLite por padrão, o que é adequado para sites de baixo a médio tráfego
- Para sites com alto tráfego, considere configurar um banco de dados externo (MySQL/PostgreSQL)
- O Dockerfile está configurado para executar como usuário não-root (node) por segurança
- As migrations são executadas automaticamente na inicialização do container
- O caminho do banco de dados SQLite agora é absoluto (/app/database/database.sqlite) para evitar problemas de path no Docker
