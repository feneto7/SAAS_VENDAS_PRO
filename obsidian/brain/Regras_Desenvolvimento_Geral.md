# Regras de Desenvolvimento Geral

## 🧹 Limpeza e Manutenção

- **NUNCA** deixar código lixo, comentários obsoletos ou arquivos redundantes nos projetos após correções ou mudanças de estrutura.
- Limpeza imediata após refatoração é obrigatória.
- Arquivos que apenas exportam outros (shells) devem ser minimizados ao estritamente necessário para o framework.

## ✅ Verificação e Linting

- **NUNCA** finalizar uma tarefa ou turn se existirem erros de lint ou TypeScript em QUALQUER arquivo do repositório.
- **VERIFICAÇÃO OBRIGATÓRIA**: Antes de cada `notify_user` ou conclusão de tarefa, o Agente DEVE rodar verificação de lint/type-check (`tsc` ou similar) em todos os subprojetos para garantir zero erros ativos.

## 🏛️ Estrutura e Organização

- Projetos DEVEM ser **100% modularizados e componentizados**.
- Pastas DEVEM ser **autodescritivas**, organizadas por funcionalidade.
- Arquivos DEVEM ter nomes **autodescritivos** que expliquem claramente seu propósito (ex: `SelectTenant/SelectTenant.tsx`).
- **NUNCA** criar nomes de arquivos ou identificadores de código (funções, variáveis, componentes) em Português. O padrão do projeto é **INGLÊS** para toda a estrutura técnica.
- Evitar arquivos gigantes; quebrar em sub-componentes e hooks sempre que a complexidade aumentar.

## 🎨 Padronização Visual e Temas

- **100% de Padronização**: Todos os elementos visuais (botões, listas, cards, inputs) DEVEM seguir um padrão único de design em todo o sistema.
- **Centralização de Estilos (CORES)**: **ESTRITAMENTE PROIBIDO** hardcodar cores (hex, rgb, rgba) nos arquivos de telas ou componentes. Todas as cores DEVEM vir obrigatoriamente do objeto `Colors` no arquivo `theme.ts`. Usar cores diretamente é considerado "código lixo" e deve ser corrigido imediatamente.
- **Semântica de Cores**: Usar tokens semânticos (ex: `buttonPrimary`, `statusSuccess`) em vez de cores diretas (`hex` ou `rgba`) para permitir mudanças globais instantâneas.
- **Ícones Puros**: NUNCA usar cores de fundo ou containers em volta de ícones. Ícones devem ser apresentados de forma "pura", apenas o glifo, para manter a leveza e padronização visual.

## ⚡ Performance e Sincronismo

- **Estratégia Local-First**: TODAS as telas que carregam dados DEVEM primeiro consultar o banco local (SQLite) e exibir as informações imediatamente para o usuário.
- **Sincronismo em Background**: O carregamento da API deve ocorrer de forma silenciosa em segundo plano após a exibição inicial dos dados locais. A interface deve ser atualizada apenas quando os dados do servidor forem recebidos, sem bloquear a navegação do usuário com loaders desnecessários se o dado local já existir.
