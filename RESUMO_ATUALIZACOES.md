# Resumo de Atualizações do Projeto - VENDAS PRO

Este documento detalha as mudanças significativas realizadas recentemente no sistema, com foco na transição de autenticação, gestão de vendedores e melhorias na arquitetura multi-tenant.

## 1. 🔐 Nova Autenticação (Remoção do Clerk)

O sistema foi migrado de uma solução externa (Clerk) para um sistema de autenticação próprio e personalizado, visando maior controle e integração com a arquitetura multi-tenant.

- **Autenticação Interna**: Agora utilizamos um sistema baseado em tokens JWT e hashes de senha armazenados diretamente no banco de cada empresa (tenant).
- **Sessão Web**: O painel administrativo gerencia a sessão através do cookie `vendas_token`.
- **Identificação de Tenant**: Todas as requisições ao servidor agora devem incluir o header `x-tenant-slug`, que permite ao backend conectar-se ao banco de dados específico daquela empresa.

## 2. 👨‍💼 Gestão de Vendedores e Colaboradores

A tabela de usuários (`users`) foi redesenhada para suportar diferentes níveis de acesso e funcionalidades integradas ao aplicativo mobile.

- **Campos de Login**:
  - `appCode`: Código numérico ou alfanumérico curto para login rápido no Mobile.
  - `passwordHash`: Senha protegida por criptografia.
  - `webAccess`: Flag que define se o colaborador pode ou não acessar o Painel Administrativo Web.
- **Papéis (Roles)**: Suporte para `admin`, `manager` e `seller` (vendedor).
- **Vínculo de Rotas**: Vendedores agora são vinculados a rotas específicas através da tabela `user_routes`, permitindo que o aplicativo mobile filtre automaticamente os clientes que cada vendedor deve atender.

## 3. 📱 Novo Fluxo de Login Mobile

O aplicativo mobile agora segue um fluxo de "Login Mágico" em dois passos:

1. **Identificação da Empresa**: O usuário digita o *Slug* da empresa (ex: `empresa-exemplo`). O app valida se esse tenant existe.
2. **Credenciais do Vendedor**: O vendedor digita seu `Código APP` e `Senha`. A validação é feita contra o banco de dados isolado daquela empresa.

## 4. 🚀 Arquitetura Multi-Tenant (Isolamento Total)

O sistema agora opera no modelo **Database-per-Tenant**:

- **Isolamento de Dados**: Cada empresa possui seu próprio banco de dados físico, garantindo que os dados de um cliente nunca se misturem com outros.
- **Provisionamento Dinâmico**: O sistema está preparado para criar novos bancos de dados e executar migrações automaticamente ao cadastrar uma nova empresa.
- **Conexão em Tempo Real**: O servidor Fastify identifica o tenant via header e estabelece a conexão com o banco correto em cada requisição.

## 5. 🎨 Melhorias de Interface (Dashboard Web)

O painel administrativo passou por uma refatoração focada em **UX Mobile-First**:

- **Modais Padronizados**: Todos os modais (Produtos, Clientes, Vendedores, Rotas) agora possuem:
  - Cabeçalho fixo com gradientes sutis.
  - Corpo rolável com scroll customizado.
  - Rodapé fixo com botões de ação sempre visíveis (mesmo em telas pequenas).
  - Design "Glassmorphism" com tons de cinza e branco sobre fundo preto premium.
- **Correções de Layout**: Ajustes em modais que antes apresentavam erros de sintaxe JSX ou sobreposição de elementos em dispositivos móveis.

---
*Este documento serve como guia técnico e histórico para as mudanças implementadas até 14 de Abril de 2026.*
