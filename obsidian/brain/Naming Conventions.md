# Padrões de Projeto e Nomenclatura

## Utilitários de Moeda (Money)

- **Regra**: Todo arquivo de utilitário responsável por formatação, conversão ou cálculos monetários DEVE se chamar `money.ts`.
- **Escopo**: Todos os projetos (Web, Mobile, Backend).
- **Motivação**: Manter consistência absoluta entre plataformas.

## Idioma e Terminologia (Inglês vs Português)

- **Código (Internal)**: Todos os identificadores técnicos (nomes de arquivos, pastas, variáveis, hooks, tipos e componentes) DEVEM ser em **Inglês**.
  - Ex: `useCardDetail`, `CardProductsTab`, `new-card`.
- **Interface (User-Facing)**: Todos os rótulos voltados ao usuário (títulos de tela, botões, alertas, mensagens) DEVEM ser em **Português**.
  - Ex: "Nova Ficha", "Detalhes da Ficha", "GERAR FICHA".
- **Motivação**: Alinhamento com padrões globais de desenvolvimento mantendo a familiaridade e correção gramatical para o usuário final.

---

_Atualizado em 2026-04-13_
