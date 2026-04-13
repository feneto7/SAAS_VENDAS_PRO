# Arquitetura e Organização do Projeto: VENDAS (SaaS)

Este documento descreve a estrutura técnica, decisões de design e o fluxo de desenvolvimento do ecossistema **VENDAS**, um sistema SaaS multi-tenant focado em gestão de vendas e logística.

---

## 1. Organização dos Projetos

O projeto é organizado como um **Monorepo**, dividido em três pilares principais:

### 📱 Mobile (`/mobile`)

- **Tecnologia**: React Native com Expo.
- **Propósito**: Aplicativo utilizado pelos vendedores em campo para registro de vendas, consulta de estoque e gerenciamento de rotas.
- **Foco**: Offline-first (parcial), alta performance e interface otimizada para toque.

### 🌐 Web (`/web`)

- **Tecnologia**: Next.js 16 (App Router), Tailwind CSS 4, Lucide React.
- **Propósito**: Painel Administrativo do lojista (Tenant).
- **Foco**: Design Premium, dashboards dinâmicos, auditoria de estoque e gestão de entidades (Clientes, Funcionários, Produtos).

### ⚙️ Server (`/server`)

- **Tecnologia**: Fastify, Drizzle ORM, PostgreSQL.
- **Propósito**: API principal que gerencia a lógica de negócio, autenticação e provisionamento.
- **Arquitetura**: Multi-tenant com isolamento físico (**Database-per-tenant**).

---

## 2. Conceitos e Arquitetura

### Multi-Tenancy (Isolamento de Dados)

O sistema utiliza a estratégia mais segura de SaaS: **uma base de dados por cliente**.

- **Master DB**: Armazena as "Empresas" (Tenants) e metadados de provisionamento.
- **Tenant DB**: Cada empresa possui seu próprio banco de dados isolado, garantindo segurança e escalabilidade.
- **Mecanismo**: O backend identifica o `x-tenant-slug` no header das requisições e conecta-se dinamicamente ao banco correto via middleware.

### Componentização e Modularização (Web)

Seguimos o padrão de **Atomic Design** simplificado para Next.js:

- **Shared Components (`/shared`)**: Componentes reutilizáveis como `Pagination`, `CustomSelect`, `Modals` básicos.
- **Tab-Based Architecture**: O dashboard é modularizado em **Abas (`/tabs`)**. Cada aba (Clientes, Produtos, Movimentações) é um módulo independente que gerencia seu próprio estado de busca, filtros e modais específicos.
- **Styles**: Uso intensivo de utilitários Tailwind 4 com variáveis globais para manter a estética premium e consistente.

---

## 3. Skills e Ferramentas de Desenvolvimento

Como assistente **Antigravity**, utilizo um conjunto de habilidades especializadas para manter o padrão do projeto:

- **backend-architect**: Para design de endpoints, transações SQL e isolamento multi-tenant.
- **frontend-design**: Focado em criar interfaces web que causem impacto visual.
- **react-native-architecture**: Estrutura de pastas, navegação e padrões de performance mobile.
- **building-native-ui**: Design focado em Expo Router e interfaces mobile fluidas.
- **mobile-design**: Princípios de UX touch-first, estados offline e padrões iOS/Android.
- **database-migrations**: Gestão rigorosa de mudanças de schema via Drizzle e scripts de migração automatizados.
- **lint-and-validate**: Verificação constante de erros de TypeScript e lógica.
- **systematic-debugging**: Diagnóstico de erros de build ou processamento (como o ajuste de estoque).

---

## 4. Caminho de Desenvolvimento (Guidelines)

### No Server (Backend)

1.  **Schema First**: Sempre defina o schema em `server/src/db/schema/tenant.ts` antes de implementar a lógica.
2.  **Transactional Logic**: Operações que envolvem estoque ou saldo **devem** ser feitas dentro de `db.transaction`.
3.  **Auditoria**: Toda alteração manual ou entrada deve registrar um log na tabela de `inventory_movements`.

### No Web (Frontend)

1.  **UX Focus**: Mantenha o padrão de "linhas finas" e tipografia limpa (Outfit/Inter).
2.  **Modularização**: Nunca coloque lógica de uma aba dentro da `page.tsx`. Use o diretório `tabs/`.
3.  **Client-Side Integrity**: Use TypeScript rigoroso para interfaces de API para evitar erros em runtime.

---

## 5. Status Atual do Projeto (Fluxo Geral)

Até o momento, o sistema já possui o núcleo operacional funcional:

1.  **Provisionamento**: Criação automática de empresas e bancos de dados.
2.  **Gestão de Produtos**: Cadastro e sistema de **Entrada de Estoque** (Compras/Devoluções).
3.  **Gestão de Logística**: Cadastro de Rotas e Clientes.
4.  **Gestão de Vendedores**: Vinculação de estoque individual por funcionário.
5.  **Auditoria de Estoque**: Sistema de Movimentações que rastreia saldos "Antes" e "Depois", permitindo ajustes manuais rastreáveis.

**Próxima Fronteira**: Sincronização em tempo real com o App Mobile e processamento financeiro das vendas realizadas em campo.
