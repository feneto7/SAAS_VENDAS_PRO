# Refatoração: Ficha para Card (Mobile)

## 📋 Resumo

Em Abril de 2024, realizamos uma refatoração estrutural no módulo de cobranças do Mobile para alinhar o código com padrões globais e melhorar a performance através de componentização.

## ⚙️ Mudanças Estruturais

- **Terminologia Internal**: Mudança de `ficha` para `card` em todos os arquivos e estados.
- **Componentização**: Divisão de `card-detail` e `new-card` em sub-componentes funcionais.
- **Hooks**: Extração de lógica para `useCardDetail` e `useNewCard`.

## 📐 Regra de Negócio vs Interface

- **Regra**: O desenvolvedor escreve `card`, o usuário lê `Ficha`.
- **Exemplo**:
  - Hook: `useNewCard`
  - Título da Tela: `Nova Ficha`
  - Variável: `cardItems`
  - Botão: `ADICIONAR À FICHA`

## 🧭 Sistema de Navegação

Implementamos uma arquitetura de navegação linear no `MainLayout`.

- **Desafio**: Perda de estado e loops em reloads.
- **Solução**: Overrides manuais no `handleBack` que reconstróem o contexto passando explicitamente `clientId`, `clientName` e `routeName`.

## 📂 Arquivos Chave Impactados

- `mobile/app/(main)/card-detail/[id].tsx`
- `mobile/app/(main)/new-card/[clientId].tsx`
- `mobile/hooks/useCardDetail.ts`
- `mobile/components/features/card/*`

---

_Data: 2026-04-13_
_Status: Concluído_
