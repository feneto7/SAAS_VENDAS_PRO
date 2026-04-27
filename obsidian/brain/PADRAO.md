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

## 🔒 INTEGRIDADE DE DADOS (Offline-First)

- **Validação de Alicerce**: Antes de implementar lógica de estado ou persistência, valide se a estrutura física existe no banco de dados local e se as migrações de schema foram executadas.
- **Regra do Elo Perdido (Sync)**: Toda ação colocada em fila de sincronismo (**Create/Update/Delete**) DEVE ter um handler correspondente no mecanismo de processamento (Worker). Nunca deixe operações sem execução definida no lado do cliente.
- **Proteção de Escrita Local (Cooldown)**: Ações manuais do usuário devem ter precedência sobre sincronismos de fundo por um período de segurança (cooldown). Evite que dados recebidos da API sobrescrevam o estado "otimista" local imediatamente após uma interação.
  - **Local Truth Over Server Truth**: Se houver uma ação pendente na fila de sincronismo (`sync_queue`) para um registro específico, os dados recebidos do servidor para esse registro DEVEM ser ignorados ou mesclados preservando a alteração local (ex: não sobrescrever `cancelled=1` se houver um cancelamento pendente).
- **Normalização Universal**: Todo dado vindo de fontes externas (APIs) deve passar por uma camada de normalização para garantir consistência com o padrão do banco local (ex: conversão de camelCase para snake_case).

## 🟢 MANUTENÇÃO

- **Zero Lixo**: Remover comentários obsoletos, arquivos redundantes e logs de debug após a conclusão de cada tarefa.
- **Schema First**: Alterações estruturais em banco de dados começam sempre pela definição do schema no ORM ou script de migração oficial antes da implementação da UI.
- **Evitar Redundância**: Sempre verificar rotas e endpoints existentes antes de criar novos para evitar erros de duplicidade ou lógica conflitante.

## 🔡 NOMENCLATURA E IDIOMA

- **Internal (English)**: Identificadores técnicos (variáveis, pastas, componentes, hooks) DEVEM ser em INGLÊS.
- **Visual (Portuguese)**: Interface e mensagens para o usuário final DEVEM ser em PORTUGUÊS.
- **Money Utility**: Utilitários financeiros devem ser centralizados e consistentes em todas as plataformas do projeto.
