# SAAS VENDAS PRO - Visão Geral do Projeto

## 📌 Contexto

Sistema SaaS multi-tenant focado em gestão de vendas e logística.

## 🏗️ Arquitetura

- **Estratégia SaaS**: Database-per-tenant (Isolamento físico).
- **Monorepo**:
  - `/server`: Fastify + Drizzle ORM + PostgreSQL.
  - `/web`: Next.js 16 (App Router) + Tailwind CSS 4.
  - `/mobile`: React Native + Expo.
- **Isolamento**: Backend identifica o `x-tenant-slug` no header e conecta dinamicamente.

## 🧬 Conceitos Chave

- **Atomic Design**: Componentização no frontend web.
- **Tab-Based Architecture**: Dashboard modularizado em abas independentes (`/tabs`).
- **Offline-first (Mobile)**: Parcialmente implementado para vendedores em campo.

## 📋 Funcionalidades Atuais

1. Provisionamento de tenants.
2. Gestão de produtos e entrada de estoque.
3. Rastreamento de movimentações (Antes/Depois) para auditoria.
4. Gestão de rotas e clientes.
5. Vinculação de estoque por vendedor.
6. Fluxo de Cobranças (Viagens): Gerenciamento de rotas por períodos de viagem.
7. Ciclo de Fichas: Transição automática (Nova -> Pendente) ao encerrar viagens.
8. Visão Detalhada do Cliente: Dashboards individuais com histórico e saldo devedor.
9. Configurações Financeiras: Juros e multas customizáveis por empresa.

## 🚀 Próximos Passos

- Sincronização em tempo real Mobile/Server.
- Processamento financeiro de vendas de campo.
