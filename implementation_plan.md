# Projeto Vendas: Arquitetura SaaS Multi-tenant Premium

Este documento detalha o plano de criação de um sistema de vendas robusto, utilizando padrões de elite das skills integradas.

## Skills Estratégicas Utilizadas
Para este projeto, aplicaremos os padrões das seguintes skills de elite:
- **Arquitetura Geral**: `senior-fullstack`, `backend-architect`, `saas-multi-tenant`.
- **Backend & Auth**: `clerk-auth`, `drizzle-orm-expert`, `neon-postgres`.
- **Frontend & App**: `nextjs-best-practices`, `react-native-architecture`, `expo-deployment`.
- **UI/UX Premium**: `shadcn`, `tailwind-patterns`, `design-spells`, `iconsax-library`, `ui-ux-pro-max`.
- **Inteligência**: `ai-product`.


## User Review Required

> [!IMPORTANT]
> **Autenticação Multi-tenant**: Utilizaremos o **Clerk Organizations** como base para o isolamento de tenants. Cada cliente do sistema será uma "Organization" no Clerk.
> **Banco de Dados**: Usaremos o **Postgres Local** com Row-Level Security (RLS) para garantir que um tenant nunca veja os dados de outro.

## Proposed Changes

O projeto será dividido em três pastas principais em `C:\Work\VENDAS`.

---

### [Component] Backend API (`/server`)

**Skills Base**: `saas-multi-tenant`, `backend-architect`, `drizzle-orm-expert`, `clerk-auth`.

Responsável por toda a lógica de negócio, autenticação e persistência.

#### [NEW] `server/`
- **Framework**: Node.js com Fastify ou Express (modularizado).
- **ORM**: Drizzle ORM para máxima performance e type-safety.
- **Banco**: Postgres Local com RLS.
- **Funcionalidades**:
  - Middleware de Tenant: Extrai `orgId` do Clerk e define `SET LOCAL app.current_tenant_id`.
  - Estrutura Modular: `/modules/vendas`, `/modules/clientes`, `/modules/produtos`.

---

### [Component] Web Application (`/web`)

**Skills Base**: `nextjs-best-practices`, `shadcn`, `tailwind-patterns`, `iconsax-library`.

Interface administrativa e de vendas para desktop.

#### [NEW] `web/`
- **Framework**: Next.js 15 (App Router).
- **Styling**: Tailwind CSS v4 + Shadcn/UI.
- **Aesthetics**: Design premium com micro-animações (Framer Motion) e ícones Iconsax.
- **Funcionalidades**:
  - Painéis administrativos 100% componentizados.
  - Dashboards de performance.

---

### [Component] Mobile Application (`/mobile`)

**Skills Base**: `react-native-architecture`, `expo-deployment`, `mobile-design`.

App para vendedores em campo.

#### [NEW] `mobile/`
- **Framework**: Expo (React Native) com Expo Router.
- **Styling**: NativeWind (Tailwind para mobile).
- **Funcionalidades**:
  - Offline-first (opcional futuro, estruturado para tal).
  - Interface nativa fluida e responsiva.

---

## Open Questions

1. **Compartilhamento de Tipos**: Como as pastas serão separadas, aceita que eu utilize um pequeno pacote compartilhado (`packages/shared`) apenas para tipos de TypeScript e Schemas do Drizzle, ou prefere duplicação controlada para manter o isolamento total?
2. **Funcionalidades Inteligentes**: Quais seriam as primeiras funcionalidades "inteligentes" que gostaria? (Ex: Recomendação de vendas, análise de churn, preenchimento automático de dados via IA).

## Verification Plan

### Automated Tests
- Scripts de validação de isolamento de tenant (tentar ler dados de Tenant B logado como Tenant A).
- Linting rigoroso em todas as pastas para garantir a modularização.

### Manual Verification
- Verificação visual do "Premium Design" em ambas as plataformas.
- Teste de fluxo completo: Criação de Tenant -> Login -> Cadastro de Produto -> Venda.
