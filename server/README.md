# VENDAS - Server API

Backend multi-tenant construído com **Fastify** e **Drizzle ORM**.

## Características principais

- Isolamento de banco de dados por cliente (Database-per-tenant).
- Autenticação e provisionamento dinâmico.
- Gestão de estoque com rastreabilidade total (Inventory Movements).
- Filtros avançados e paginação SQL nativa.

## Instalação

```bash
cd server
npm install
```

## Configuração

Crie um arquivo `.env` na raiz da pasta `server` com as seguintes variáveis:

```env
DATABASE_URL=postgres://usuario:senha@localhost:5432/vendas_master
PORT=3001
```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor em modo de desenvolvimento.
- `npm run generate`: Gera as migrações via Drizzle (quando houver mudanças no schema).
- `npm run migrate`: Executa as migrações no banco master.
- `npm run migrate:tenants`: Propaga as migrações para todos os bancos de tenant existentes.
- `npm run db:studio`: Abre a interface visual do Drizzle para explorar o banco.

## Organização Interna

- `/src/db/schema`: Definições das tabelas master e tenant.
- `/src/middleware`: Logics como identificação de tenant.
- `/src/scripts`: Scripts de utilidade para migração e provisionamento.
