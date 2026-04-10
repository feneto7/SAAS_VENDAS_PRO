# VENDAS SaaS - Gestão de Vendas e Logística

Este é um sistema monorepo para gestão de vendas SaaS Multi-tenant (Database-per-tenant).

## Estrutura do Projeto

- **/server**: API Backend (Fastify + Drizzle ORM). Gerencia múltiplos bancos de dados dinamicamente.
- **/web**: Painel Administrativo (Next.js 16 + Tailwind CSS 4). Interface premium para gestão empresarial.
- **/mobile**: Aplicativo do Vendedor (React Native / Expo). Focado em produtividade campo.

## Pré-requisitos Globais

- **Node.js**: Versão 18 ou superior.
- **PostgreSQL**: Rodando localmente ou via Docker.
- **Git**: Para controle de versão.

## Como Instalar e Rodar o Ecossistema

### 1. Servidor (Backend)
```bash
cd server
npm install
# Configure o .env (ver instrução no README do server)
npm run migrate # Migra banco master e todos os tenants
npm run dev
```

### 2. Painel Web
```bash
cd web
npm install
# Configure o .env (ver instrução no README da web)
npm run dev
```

### 3. Aplicativo Mobile
```bash
cd mobile
npm install
npx expo start
```

## Arquitetura Detalhada
Para mais detalhes sobre as decisões técnicas, consulte o arquivo [ARCHITECTURE.md](./ARCHITECTURE.md).
