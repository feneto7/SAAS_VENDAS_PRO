# 📜 PADRÃO GLOBAL DE DESENVOLVIMENTO

Este documento contém as regras fundamentais que DEVEM ser seguidas em TODOS os projetos. Estão organizadas por prioridade.

## 🔴 IMPRESCINDÍVEL (Prioridade Máxima)

- **Limpeza de Turno**: NUNCA finalizar uma tarefa se existirem erros de lint ou TypeScript. Verificação obrigatória (`tsc` / lint) antes de `notify_user`.
- **Linguagem Técnica**: Identificadores (variáveis, funções, pastas, arquivos) DEVEM ser em **INGLÊS**.
- **Centralização de Estilos**: **PROIBIDO** hardcodar cores (hex/rgba). Todas as cores DEVEM vir de `theme.ts` ou do sistema de tokens definido.
- **Padrão de Memória**: O vault `brain` DEVE ser consultado antes de qualquer ação e atualizado IMEDIATAMENTE após novos aprendizados.

## 🟠 ESTRUTURA E ORGANIZAÇÃO

- **Modularização 100%**: Projetos componentizados; evitar arquivos gigantes; extrair lógica para hooks.
- **Autodescrição**: Nomes de pastas e arquivos devem explicar claramente sua função.
- **Atomic Design**: Seguir a arquitetura de componentes atômicos e layouts baseados em abas.

## 🟡 PERFORMANCE E UX

- **Local-First**: Priorizar leitura de banco local (SQLite) para resposta instantânea.
- **Background Sync**: Sincronismo com API deve ser silencioso e não bloquear a UI.
- **Estética Elite**: Design premium (glassmorphism, animações suaves, tipografia limpa). Seguir rigorosamente os padrões de UI definidos.

## 🟢 MANUTENÇÃO

- **Zero Lixo**: Remover comentários obsoletos, arquivos redundantes e logs de debug após a conclusão da tarefa.
- **Drizzle Schema First**: Alterações em banco de dados começam sempre pela definição do schema no ORM.

## 🔡 NOMENCLATURA E IDIOMA

- **Internal (English)**: Identificadores técnicos (variáveis, pastas, componentes, hooks) DEVEM ser em INGLÊS.
- **Visual (Portuguese)**: Tudo o que o usuário vê (botões, títulos, alertas) DEVE ser em PORTUGUÊS.
- **Money Utility**: Arquivos de utilitários financeiros devem sempre se chamar `money.ts` para consistência multi-plataforma.
