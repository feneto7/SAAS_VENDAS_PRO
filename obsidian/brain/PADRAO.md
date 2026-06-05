# 📜 PADRÃO GLOBAL DE DESENVOLVIMENTO

Este documento contém as regras fundamentais que DEVEM ser seguidas em TODOS os projetos. Estão organizadas por prioridade.

## 🔴 IMPRESCINDÍVEL (Prioridade Máxima)

- **Limpeza de Turno**: NUNCA finalizar uma tarefa se existirem erros de lint ou TypeScript. Verificação obrigatória (`tsc` / lint) antes de `notify_user`.
- **🔴 ATENÇÃO MÁXIMA E PRIORIDADE ABSOLUTA: REMOVER CÓDIGOS E ARQUIVOS LIXOS!** Sempre que fizer qualquer alteração no sistema, é **OBRIGATÓRIO** rastrear globalmente em todos os arquivos onde a mudança reflete e remover **IMEDIATAMENTE** códigos, variáveis, rotas, tipos, funções, handlers IPC, importações e arquivos antigos/obsoletos referentes à forma antiga. **NUNCA** deixe resíduos ou lixo técnico no projeto. Isso é imprescindível, prioritário e de atenção máxima!
- **Regra de Ouro dos Hooks (React)**: **NUNCA** coloque retornos condicionais (`if (!isOpen || !receivable) return null;`) antes de ganchos (`useState`, `useEffect`, `useMemo`, `useCallback`). Todos os Hooks devem ser declarados obrigatoriamente no topo do componente, antes de qualquer saída antecipada.
- **Prevenção de Loops Infinitos (React)**: **NUNCA** coloque objetos inteiros retornados por Custom Hooks (como o objeto retornado por `useLocalDb()`) diretamente no array de dependências de um `useEffect`. Se o hook retornar um novo objeto a cada render (não-memoizado), isso causará um loop infinito. Em vez disso, dependa apenas de propriedades primitivas ou estáveis (ex: `[localDb.isAvailable]`) ou desestruture as funções.
- **Controle de Commits e Push**: **NUNCA** faça `git commit` ou `git push` de forma autônoma sem a autorização ou instrução expressa e direta do usuário.
- **Linguagem Técnica**: Identificadores (variáveis, funções, pastas, arquivos) DEVEM ser em **INGLÊS**.
- **Centralização de Estilos**: **PROIBIDO** hardcodar cores (hex/rgba). Todas as cores DEVEM vir de `theme.ts` ou do sistema de tokens definido.
- **Botões de Ação em Listagens**: **TODAS** as colunas de "Ações" em listagens/grids do sistema devem utilizar OBRIGATORIAMENTE o componente `<ActionButton />` (`src/renderer/components/ActionButton/ActionButton.tsx`), garantindo o estilo neomórfico unificado (como nas telas Clients, Products, Suppliers).
- **Padrão de Memória**: O vault `brain` DEVE ser consultado antes de qualquer ação e atualizado IMEDIATAMENTE após novos aprendizados.

## 🟠 ESTRUTURA E ORGANIZAÇÃO

- **Modularização 100%**: Projetos componentizados; evitar arquivos gigantes; extrair lógica para hooks.
- **Modais Modularizados**: Modais secundários ou de ações de página **NUNCA** devem ser desenvolvidos inline diretamente na tela. Eles **DEVEM** ser estruturados como componentes independentes. Se forem modais reutilizados em vários lugares, devem ficar na pasta global `src/renderer/components/` (e importados via lazy loading se pesados). Se forem modais específicos de uma única tela (como o de Exportação de Balança), devem ficar na pasta `components/` interna daquela página (ex: `src/renderer/pages/NomeDaPagina/components/`), utilizando sempre o componente base `<WindowHeader />` e os tokens de `systemStyles.modal` para garantir consistência visual perfeita.
- **Autodescrição**: Nomes de pastas e arquivos devem explicar claramente sua função.
- **Janelas Externas**: Telas que devem abrir como janela independente (ex: Agendamentos, Entradas, Operações, Fiscal, Atendimentos) seguem o padrão: (1) handler IPC no main process (`open-xxx-window`), (2) método exposto no preload bridge, (3) detecção de `?window=xxx` no `App.tsx`, (4) componente `XxxWindowRouter.tsx` ou wrapper que envolve o conteúdo com `<ThemeProvider>` e **OBRIGATORIAMENTE** com um contêiner raiz de largura/altura total (`100vw/100vh`) aplicando o background dinâmico do tema (`systemColors.background.primary`). Isso é vital porque o `reset.css` define um gradiente claro no `body` global e, sem esse contêiner com background dinâmico do tema, o fundo claro vazará no tema Dark/Black, gerando uma falha crítica de contraste. Nunca usar `navigate()` para janelas externas.
- **Padrão Rigoroso de Formulários**: NUNCA crie inputs ou selects "puros" com estilos soltos. Todo campo de texto/dados DEVE usar o contêiner `systemStyles.input.container` e a label `systemStyles.input.label`. Para selects, a hierarquia EXATA deve ser respeitada para manter o design MAC: `systemStyles.select.container` -> `systemStyles.select.fieldWrapper` -> `<select style={systemStyles.select.field}>` -> `<div style={systemStyles.select.arrow}><div style={systemStyles.select.arrowIcon}/></div>`.
- **Botões de Adição em Formulários**: Se houver um botão de "adicionar" ou "novo" ao lado de um select (como cliente/fornecedor), utilize OBRIGATORIAMENTE o componente global `<AddButton />` (`src/renderer/components/AddButton/AddButton.tsx`).
- **Atomic Design**: Seguir a arquitetura de componentes atômicos e layouts baseados em abas.

## 🟡 PERFORMANCE E UX

- **Local-First**: Priorizar leitura de banco local (SQLite) para resposta instantânea.
- **Background Sync**: Sincronismo com API deve ser silencioso e não bloquear a UI.
- **Estética Elite**: Design premium (glassmorphism, animações suaves, tipografia limpa). Seguir rigorosamente os padrões de UI definidos.
- **Som de Clique (useClickSound)**: Todos os botões, checkboxes e elementos interativos clicáveis devem utilizar o hook `useClickSound` para emitir o som de clique padrão do sistema.

## 🔒 INTEGRIDADE DE DADOS (Offline-First)

- **Validação de Alicerce**: Antes de implementar lógica de estado ou persistência, valide se a estrutura física existe no banco de dados local e se as migrações de schema foram executadas.
- **Regra do Elo Perdido (Sync)**: Toda ação colocada em fila de sincronismo (**Create/Update/Delete**) DEVE ter um handler correspondente no mecanismo de processamento (Worker). Nunca deixe operações sem execução definida no lado do cliente.
- **Proteção de Escrita Local (Cooldown e Race Conditions)**: Ações manuais do usuário devem ter precedência sobre sincronismos de fundo. Evite que dados atrasados recebidos da API sobrescrevam o estado "otimista" local, o que gera o efeito "vai e volta".
  - **Local Truth Over Server Truth (Sync Queue)**: Se houver uma ação pendente na fila de sincronismo (`sync_queue`) para um registro específico, os dados recebidos do servidor para esse registro DEVEM ser ignorados ou mesclados preservando a alteração local.
  - **Prevenção de Race Condition e Travas Definitivas (Trava de Mão)**: Em situações onde um status é irreversível (ex: travar uma ficha, `items_locked = 1`), o código local de atualização a partir do servidor **OBRIGATORIAMENTE** deve ler o banco SQLite local *antes* de sobrescrever e respeitar a trava local. Se a trava for 1 no banco local, ela *nunca* deve ser retrocedida para 0 apenas porque o servidor mandou 0 (já que o servidor pode apenas não ter processado o sync ainda). Use sempre a premissa `Math.max(local, server)` ou `local || server` para estados definitivos.
- **Normalização Universal**: Todo dado vindo de fontes externas (APIs) deve passar por uma camada de normalização para garantir consistência com o padrão do banco local (ex: conversão de camelCase para snake_case).

## 🟢 MANUTENÇÃO

- **Zero Lixo**: Remover comentários obsoletos, arquivos redundantes e logs de debug após a conclusão de cada tarefa.
- **Schema First**: Alterações estruturais em banco de dados começam sempre pela definição do schema no ORM ou script de migração oficial antes da implementação da UI.
- **Evitar Redundância**: Sempre verificar rotas e endpoints existentes antes de criar novos para evitar erros de duplicidade ou lógica conflitante.
- **Gestão Proativa de Dependências e Ambiente (CRÍTICO)**: A IA deve atuar como uma Engenheira de Software Sênior. Ao adicionar, configurar ou sugerir QUALQUER pacote, biblioteca (nativa ou não), ou ferramenta de build, é **OBRIGATÓRIO** prever e configurar automaticamente todos os scripts de setup, `postinstall`, tipagens (`@types`), compatibilidade de versões e variáveis de ambiente necessárias para que o ecossistema funcione "out-of-the-box". Nunca espere um erro estourar no terminal (como incompatibilidade de `NODE_MODULE_VERSION`, falta de tipagem, ou erro de compilação) para propor a configuração correta. O sistema deve estar sempre pronto para rodar perfeitamente após um simples `npm install` em qualquer nova máquina.

## 🔡 NOMENCLATURA E IDIOMA

- **Internal (English)**: Identificadores técnicos (variáveis, pastas, componentes, hooks) DEVEM ser em INGLÊS.
- **Visual (Portuguese)**: Interface e mensagens para o usuário final DEVEM ser em PORTUGUÊS.
- **Comentários Humanos**: Os comentários devem APENAS dizer o que cada bloco de código faz de forma direta. O texto deve ser natural, para que quem ler o código depois NÃO PERCEBA que foi criado por IA. É expressamente PROIBIDO o uso de comentários "robóticos" com explicações excessivas de como ou por que algo foi feito.
- **Money Utility**: Utilitários financeiros devem ser centralizados e consistentes em todas as plataformas do projeto.
