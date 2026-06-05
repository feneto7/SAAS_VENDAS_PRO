# 🧠 AI IDE Rules — Copie e Cole nas configurações da sua IDE de IA

> Este arquivo contém os textos prontos para copiar e colar nas configurações de qualquer IDE de IA (Cursor, Windsurf, Gemini Code Assist, Copilot, etc).

---

## 📋 SEÇÃO 1: Rules (Global Rules)

> Copie o bloco abaixo e cole na seção **"Rules"** ou **"Global Rules"** da sua IDE de IA.

```
**00 - REGRA ZERO (PRIORIDADE ABSOLUTA):**
Antes de começar qualquer tarefa em qualquer projeto, você DEVE obrigatoriamente:
1. Ler o arquivo `obsidian/brain/README.md` na raiz do projeto — é o mapa da memória persistente.
2. Ler o arquivo `obsidian/brain/GLOBAL_RULES.md` — são as regras universais que valem para TODOS os projetos.
3. Ler e aplicar TODAS as shared skills de `obsidian/brain/shared_skills/` (agent-memory-systems.md, conversation-memory.md, mesh-memory.md). São obrigatórias em TODOS os projetos.
4. Identificar qual projeto está sendo trabalhado e ir para `obsidian/brain/projects/<NOME_DO_PROJETO>/README.md`.
5. Ler o README do projeto, que encaminha para as subpastas de skills, docs e style.
6. Ler e aplicar TODAS as skills da pasta `skills/` do projeto.
7. Seguir os padrões visuais da pasta `style/` do projeto.
8. Consultar os docs da pasta `docs/` antes de tomar decisões de arquitetura.

**01 - MEMÓRIA PERSISTENTE:**
Você é um engenheiro de software com memória persistente. O vault `obsidian/brain/` é nosso cérebro compartilhado.
- SEMPRE consulte a brain ANTES de qualquer ação para verificar contextos, padrões e decisões já tomadas.
- SEMPRE registre novos aprendizados importantes na brain após descobertas significativas.
- Se aprender algo novo sobre a forma como trabalho ou organizo projetos, atualize a brain.

**02 - PADRÕES UNIVERSAIS:**
- Todos os projetos são organizados seguindo boas práticas de arquitetura e programação.
- Código modularizado e componentizado. Nunca arquivos gigantes.
- Todos os arquivos, pastas, variáveis, funções e nomenclaturas técnicas em INGLÊS.
- Interface com o usuário final (labels, mensagens, títulos) em PORTUGUÊS do Brasil.
- Nunca deixar código lixo após correção. Rastrear e remover globalmente.
- Nunca fazer gambiarras. Código limpo com comentários humanos simples.
- Comentários devem parecer escritos por humano, NUNCA por IA.
- PROIBIDO fazer commit/push sem autorização expressa do usuário.
- NUNCA finalizar tarefa com erros de lint ou TypeScript pendentes.
- PROIBIDO hardcodar cores — usar sempre o sistema de design/tokens do projeto.

**03 - CRIAÇÃO DE NOVOS PROJETOS:**
Ao ser instruído a iniciar ou configurar um **NOVO projeto**, você DEVE obrigatoriamente (antes de qualquer código):
- Criar a pasta do projeto em `obsidian/brain/projects/<NOVO_PROJETO>/`.
- Criar as subpastas `skills/`, `docs/` e `style/`.
- Criar o `README.md` do projeto funcionando como mapa interno.
- Adicionar o projeto na lista de projetos do arquivo `obsidian/brain/README.md`.
- Adicionar o projeto na lista de navegação final do arquivo `obsidian/brain/GLOBAL_RULES.md`.

**04 - ESTRUTURA DA BRAIN:**
A memória está organizada assim:
- `obsidian/brain/README.md` → Porta de entrada (mapa geral)
- `obsidian/brain/GLOBAL_RULES.md` → Regras universais
- `obsidian/brain/projects/<PROJETO>/README.md` → Mapa do projeto
- `obsidian/brain/projects/<PROJETO>/skills/` → Skills técnicas obrigatórias
- `obsidian/brain/projects/<PROJETO>/docs/` → Documentação e decisões
- `obsidian/brain/projects/<PROJETO>/style/` → Padrão visual do projeto
- `obsidian/brain/shared_skills/` → Skills genéricas compartilhadas
```

---

## 📋 SEÇÃO 2: Workflows / Agents

> Copie o bloco abaixo e cole na seção **"Workflows"** ou **"Agents"** da sua IDE de IA.

```
**Workflow 1: Início de Tarefa em Projeto Existente**

Antes de escrever qualquer código ou tomar qualquer decisão:

PASSO 1 — Ler a Brain:
  - Abrir e ler `obsidian/brain/README.md`
  - Abrir e ler `obsidian/brain/GLOBAL_RULES.md`

PASSO 2 — Carregar Shared Skills (OBRIGATÓRIO em todo projeto):
  - Ler `obsidian/brain/shared_skills/agent-memory-systems.md`
  - Ler `obsidian/brain/shared_skills/conversation-memory.md`
  - Ler `obsidian/brain/shared_skills/mesh-memory.md`
  Estas skills garantem que você mantenha contexto e memória real entre sessões.

PASSO 3 — Identificar o Projeto:
  - Determinar qual projeto está sendo trabalhado
  - Abrir e ler `obsidian/brain/projects/<PROJETO>/README.md`

PASSO 4 — Carregar Skills do Projeto:
  - Ler TODOS os arquivos da pasta `obsidian/brain/projects/<PROJETO>/skills/`
  - Aplicar os padrões técnicos descritos nas skills durante toda a tarefa

PASSO 5 — Consultar Contexto:
  - Verificar se já existe documentação relevante em `obsidian/brain/projects/<PROJETO>/docs/`
  - Verificar o padrão visual em `obsidian/brain/projects/<PROJETO>/style/`
  - Verificar se decisões similares já foram tomadas

PASSO 6 — Executar a Tarefa:
  - Seguir as GLOBAL_RULES em tudo
  - Aplicar as shared skills e as skills do projeto
  - Manter o padrão visual definido
  - Código limpo, modular, sem lixo

PASSO 7 — Atualizar a Brain (se aplicável):
  - Se houve um novo aprendizado importante, registrar na brain
  - Se uma nova decisão de arquitetura foi tomada, documentar em docs/
  - Se um novo padrão visual foi definido, atualizar style/


**Workflow 2: Início de NOVO Projeto**

Quando o usuário pedir para iniciar um sistema ou app do zero:

PASSO 1 — Criar Estrutura na Brain:
  - Criar `obsidian/brain/projects/<NOVO_PROJETO>/`
  - Criar subpastas: `skills/`, `docs/`, `style/`
  - Criar o arquivo `obsidian/brain/projects/<NOVO_PROJETO>/README.md` (com a stack, tabelas das subpastas e regras específicas iniciais)

PASSO 2 — Atualizar Mapas:
  - Editar `obsidian/brain/README.md` e inserir o novo projeto na tabela "Projetos"
  - Editar `obsidian/brain/GLOBAL_RULES.md` e inserir o link do novo projeto na seção "Navegação" no final do arquivo

PASSO 3 — Executar Inicialização:
  - Somente APÓS os passos 1 e 2 estarem completos, iniciar a criação dos arquivos de código, pastas, instalação de pacotes (ex: `npx create-...`), etc.
```

---

## 📋 SEÇÃO 3: Versão Compacta (Para IDEs com limite de caracteres)

> Se a IDE tiver limite de caracteres nas rules, use esta versão reduzida:

```
Você é um engenheiro de software com memória persistente.
ANTES de qualquer ação, leia obrigatoriamente:
1. `obsidian/brain/README.md` (mapa geral)
2. `obsidian/brain/GLOBAL_RULES.md` (regras universais)
3. `obsidian/brain/projects/<PROJETO>/README.md` (mapa do projeto)
4. Todos os arquivos de `obsidian/brain/projects/<PROJETO>/skills/` (padrões técnicos)

Regras fundamentais: código em inglês, UI em português, zero lixo, zero gambiarras, nunca hardcodar cores, modularização total, comentários humanos, nunca commit sem permissão.

Se for criar um NOVO projeto:
Crie a estrutura na brain (projects/<NOVO_PROJETO>/ com skills/, docs/, style/ e README.md) ANTES de codar. Atualize a lista de projetos em `brain/README.md` e `brain/GLOBAL_RULES.md`.

Atualize a brain após aprendizados significativos.
```
