# 📜 GLOBAL RULES — Regras Universais de Desenvolvimento

> Este documento contém as regras fundamentais que **DEVEM ser seguidas em TODOS os projetos, sem exceção.**
> São as regras que definem como eu trabalho, independente do projeto.

---

## 🔴 IMPRESCINDÍVEL (Prioridade Máxima)

### Limpeza de Código
- **NUNCA** finalizar uma tarefa se existirem erros de lint ou TypeScript. Verificação obrigatória antes de entregar.
- **ATENÇÃO MÁXIMA: REMOVER CÓDIGOS E ARQUIVOS LIXOS!** Sempre que fizer qualquer alteração, rastrear globalmente em todos os arquivos onde a mudança reflete e remover **IMEDIATAMENTE** códigos, variáveis, rotas, tipos, funções, importações e arquivos antigos/obsoletos. **NUNCA** deixe resíduos ou lixo técnico no projeto.
- **Zero Gambiarras**: O código deve ser limpo, legível e sem soluções paliativas. Se algo precisa ser feito, faça da forma correta.

### Linguagem e Nomenclatura
- **Infraestrutura Técnica (100% em INGLÊS)**: Variáveis, funções, componentes, pastas, arquivos, rotas e parâmetros **DEVEM** ser em inglês.
- **Interface com Usuário (100% em PORTUGUÊS)**: Labels, placeholders, títulos, mensagens e textos visíveis ao usuário final devem ser em português do Brasil.
- **Comentários Humanos**: Comentários devem apenas dizer o que cada bloco faz de forma direta e natural. **PROIBIDO** usar comentários robóticos, excessivos ou com estruturas típicas de IA. Quem ler o código NÃO pode perceber que foi criado por IA.
- **PROIBIDO** divisores artificiais (ex: `//----------`) ou cabeçalhos redundantes no topo de arquivos.

### Controle de Versão
- **NUNCA** fazer `git commit` ou `git push` sem autorização expressa do usuário.

### Memória Persistente (Brain)
- O vault `brain` DEVE ser consultado **antes de qualquer ação** e atualizado **imediatamente após novos aprendizados**.
- Ao entrar em qualquer projeto, **sempre ler** o `GLOBAL_RULES.md` primeiro, depois ir para a pasta do projeto e ler o `README.md` do projeto.

### Criação de Novos Projetos
- Ao iniciar um **novo projeto**, é OBRIGATÓRIO criar a estrutura padrão na Brain ANTES de escrever qualquer código.
- Crie a pasta do projeto em `obsidian/brain/projects/<NOVO_PROJETO>/` contendo as subpastas `skills/`, `docs/` e `style/`, além do `README.md` como mapa interno.
- Atualize OBRIGATORIAMENTE as listas de projetos no `obsidian/brain/README.md` (Mapa Geral) e no final do `obsidian/brain/GLOBAL_RULES.md` adicionando o novo projeto.

---

## 🟠 ESTRUTURA E ORGANIZAÇÃO

### Arquitetura e Boas Práticas
- **Modularização 100%**: Projetos componentizados. Evitar arquivos gigantes. Extrair lógica para hooks/utils.
- **Atomic Design**: Seguir arquitetura de componentes atômicos quando aplicável.
- **Autodescrição**: Nomes de pastas e arquivos devem explicar claramente sua função.
- **README em cada pasta**: Cada pasta relevante deve ter um README descrevendo o que cada arquivo da pasta faz.

### Modais e Componentes
- **Modais Modularizados**: Modais **NUNCA** devem ser declarados inline no arquivo principal da página. Devem ser extraídos como componentes independentes em uma subpasta `components/`.
- **Separação de Responsabilidades**: Cada componente, uma responsabilidade. Cada arquivo, um propósito claro.
- **Evitar Duplicidades**: Sempre verificar se já existe algo similar antes de criar algo novo.

### Estilos e Cores
- **Centralização de Estilos**: **PROIBIDO** hardcodar cores (hex/rgba). Todas as cores DEVEM vir do sistema de design/tokens definido no projeto.
- **Homogeneidade**: O sistema DEVE ser homogêneo. Todos os componentes do mesmo tipo devem ter o mesmo estilo e comportamento.
- **Se faltar estilo** para um novo tipo de componente, o estilo DEVE ser definido no arquivo central de estilos para ser reutilizado.

---

## 🟡 PERFORMANCE E UX

- **Estética Premium**: Design de alta qualidade (glassmorphism, animações suaves, tipografia limpa). Seguir rigorosamente os padrões visuais definidos em cada projeto.
- **Responsividade**: Interfaces devem se adaptar de forma fluida.
- **Feedback Visual**: Toda ação do usuário deve ter feedback visual imediato (loading, animações, toasts).

---

## 🟢 MANUTENÇÃO

- **Zero Lixo**: Remover comentários obsoletos, arquivos redundantes e logs de debug após cada tarefa.
- **Schema First**: Alterações em banco de dados começam pela definição do schema/migração ANTES da UI.
- **Evitar Redundância**: Verificar rotas e endpoints existentes antes de criar novos.
- **Gestão Proativa de Dependências**: Ao adicionar qualquer pacote ou biblioteca, configurar automaticamente tudo que é necessário (tipagens, scripts, variáveis de ambiente) para funcionar "out-of-the-box".

---

## 🔒 INTEGRIDADE DE DADOS

- **Validação de Estrutura**: Antes de implementar lógica de estado ou persistência, validar se a estrutura física existe no banco.
- **Normalização Universal**: Todo dado vindo de fontes externas deve passar por normalização para garantir consistência.

---

## 🧰 SKILLS (LEITURA OBRIGATÓRIA — SEMPRE)

### Skills do Projeto
- **SEMPRE** ler e aplicar TODOS os arquivos da pasta `obsidian/brain/projects/<PROJETO>/skills/`.
- Skills são padrões técnicos que DEVEM ser seguidos no projeto. Sem exceção.

### Shared Skills (OBRIGATÓRIO EM TODOS OS PROJETOS)
As skills abaixo ficam em `obsidian/brain/shared_skills/` e devem ser **lidas e aplicadas em qualquer projeto**, pois definem como a IA mantém contexto, memória e continuidade entre sessões:

| Skill | O que faz |
|-------|----------|
| `agent-memory-systems.md` | Arquitetura de memória de agentes (semântica, episódica, procedimental). Garante que a IA saiba como estruturar e recuperar informações entre sessões. |
| `conversation-memory.md` | Padrões de persistência de conversas (tiered memory, entity memory). Define como armazenar e recuperar contexto de forma segura e eficiente. |
| `mesh-memory.md` | Busca semântica, auto-tagging e integração MCP. Define como a IA indexa e recupera informações da brain de forma inteligente. |

> 🚨 **Estas skills garantem que você (IA) funcione como um engenheiro com memória real, não como um bot que começa do zero a cada sessão.**

---

## 🗺️ Navegação

Após ler estas regras, vá para o projeto específico:

- [→ SAAS_VENDAS_PRO](projects/SAAS_VENDAS_PRO/README.md)
- [→ NETCOM](projects/NETCOM/README.md)
- [→ TCG_PROJECT](projects/TCG_PROJECT/README.md)
