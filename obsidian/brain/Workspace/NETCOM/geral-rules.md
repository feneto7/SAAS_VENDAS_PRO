# Regras de Desenvolvimento - Projeto NETCOM

Este arquivo é a fonte de verdade para as regras de estilo, arquitetura e organização do projeto NETCOM.

## Regras de Estilo do Projeto

- *Sempre utilizar as cores e estilos do styles/systemStyle.ts*
- *O layout das paginas e modais devem ser sempre inspiradas no sistema MAC e estilos minimalistas*
- *Os campos de valores devem utilizar o codigo de utils/money.ts*
- *Os campos de quantidade devem utilizar o codigo de utils/quantityFormater.ts*
- **Todas as paginas devem seguir o msm padrao de estilo e layout de paginas, assim como os modais devem seguir o msm padrao de estilo e layout de modais para serem padronizadas estilos definidos em styles/systemStyle.ts**
- *Se faltar definir estilo para algum novo tipo de componente inspirado no MAC, o estilo deve ser definido no styles/systemStyle.ts para ser reutilizado depois e definir como padrao esse tipo de componente*

## Regras de Código e Organização

- **Remover codigos e arquivos lixos nos arquivos e pastas**
- **Se mudar algo no sistema remover codigos e arquivos referentes a como era a forma antiga para evitar lixos**
- **Evitar duplicidades e codigos duplicados**
- **Se for identificado um erro, criar uma regra para sempre fazer o codigo certo para evitar o erro novamente**
- **Apesar de se basear no estilo do MACOS isso nao deve ser citado em comentarios nem em nome de arquivos, nome "MAC"**
- **As camadas de containers (plano de fundo, container intermediario e cards internos) devem manter o mesmo padrao de contraste em todos os temas. Se no tema dark o container de pedidos é mais escuro que o fundo, o tema light deve respeitar a mesma hierarquia de tons utilizando as cores equivalentes do tema**

### Homogeneidade
- **O sistema DEVE ser homogêneo e sem inconsistências**
- **NÃO PODE** uma tela ter um campo de select com um estilo definido e em outra tela não ter, tudo deve ser padronizado com estilos compartilhados do arquivo de estilo.
- **TODOS** os componentes do mesmo tipo devem vir do mesmo lugar e ter o mesmo comportamento (padronizacao e modularização)
- **TUDO** deve ser padronizado e utilizar os mesmos componentes base (modularizado)

### Estilos Globais
- **Estilos que se aplicam a toda a aplicação devem estar no `styles/reset.css`**
- Estilos específicos de componentes devem estar no `styles/systemStyle.ts`
- Componentes reutilizáveis devem utilizar os hooks definidos in `hooks/`
- **Fundo de Janelas e Roteadores Secundários (TEMA DINÂMICO - CRÍTICO):** Toda nova janela independente ou roteador raiz de janela secundária (ex: `OperationsWindowRouter`, `XxxWindowRouter`) deve **obrigatoriamente** envelopar seu conteúdo em um contêiner de largura/altura total (`100vw/100vh`) aplicando o background dinâmico do tema (`systemColors.background.primary`). Como o `reset.css` define um gradiente sutil claro no `body` global da aplicação, a falta de um contêiner envelopador com background dinâmico faz com que o fundo claro original "vaze" nas janelas de tema escuro (Dark/Black), que é um erro visual grave de inconsistência e contraste.

### Páginas
- Todas as páginas devem seguir o **MESMO padrão de estilo e layout**
- Utilizar os estilos de `systemStyles.page` para estruturar páginas

### Modais
- Todos os modais devem seguir o **MESMO padrão de estilo e layout definido em styles/systemStyle.ts**
- Utilizar os estilos de `systemStyles.modal` para estruturar modais
- **SEPARAÇÃO DE ARQUIVOS OBRIGATÓRIA (CRÍTICO):** Modais **NUNCA** devem ser criados ou declarados inline dentro do arquivo principal da página ou da aba. Qualquer modal, sem exceções, deve ser extraído para seu próprio arquivo de componente independente dentro de uma subpasta local `/components/` (ex: `forms/components/ConversionModal.tsx`). Isso impede o crescimento descontrolado dos arquivos e preserva a modularização estrita do projeto.

### 1. Nomenclatura e Idiomas (CRÍTICO)
- **Infraestrutura Técnica (100% em INGLÊS):**
  - Todas as pastas, arquivos, componentes, variáveis, constantes, loops, lets e nomes de funções **devem ser escritos exclusivamente em inglês**.
  - **Rotas e Parâmetros:** Os identificadores de rotas no roteador do sistema (ex: `app.tsx`, `Navigation.tsx`) devem ser definidos em inglês (ex: `entries` e não `entradas`).
  - **ATENÇÃO MÁXIMA:** Mesmo que a especificação da tarefa ou o Usuário solicitem uma tela/pasta pelo seu nome em português (ex: "crie a tela de Entradas" ou "crie a pasta de Endereçamento"), a inteligência artificial **deve obrigatoriamente traduzir os nomes de pastas e arquivos para o inglês** (ex: `Entries/` e `Addressing/`) antes da criação física.
- **Interface com o Usuário e Comentários (100% em PORTUGUÊS):**
  - Todos os comentários explicativos do código, as labels de campos de formulário, placeholders, títulos de tela, mensagens de erro, modais e qualquer texto visível ao usuário final devem ser escritos em **português do Brasil**.
  - **Comentários Naturais e Livres de Padrões de IA (CRÍTICO):** Os comentários devem ser "humanos", resumidos e espontâneos, sem jargões robóticos ou estruturas típicas de IA.
  - **PROIBIÇÃO DE DIVISORES E CABEÇALHOS ARTIFICIAIS:** É expressamente proibido inserir blocos de comentários delimitadores artificiais (ex: `//-------------------------------------------------`) ou cabeçalhos redundantes no topo de arquivos descrevendo o nome ou finalidade do arquivo de forma repetitiva. O código deve iniciar diretamente com os imports ou com a declaração do módulo de forma limpa e profissional.


### 2. Qualidade de Código
- **Evitar duplicidades de código**
- Manter sempre uma estrutura organizada
- Tentar manter o código o mais limpo possível
- Adicionar comentários resumidos e naturais explicando qual parte do sistema o código faz parte e onde ele é utilizado

### 3. Roteamento
- As rotas estão definidas em `app.tsx`

### 4. Modularização Fina (APRENDIZADO CRÍTICO)
- **Separar componentes reutilizáveis**
- **Criar módulos independentes e coesos**
- **Evitar arquivos gigantes agregadores de múltiplos componentes**:
  - Quando um componente de página ou aba crescer (por exemplo, ao possuir modais de cadastro, tabelas específicas ou sub-formulários complexos), **nunca** misture tudo no mesmo arquivo.
  - Crie uma pasta específica para o componente principal (ex: `src/renderer/pages/Settings/components/PaymentsForm/`).
  - Dentro dessa pasta, crie o arquivo principal (`PaymentsForm.tsx`) e uma subpasta `components/` dedicada exclusivamente para armazenar os subcomponentes modulares daquela aba (ex: `PaymentMethodModal.tsx`).
  - Mantenha os arquivos pequenos, focados e autoexplicativos.

### 5. Integração com a API Backend (netcom-api)
- **NUNCA modificar o código da `netcom-api` (backend em Laravel)**. O backend é responsabilidade de outro desenvolvedor.
- Qualquer alteração, rota, ou lógica necessária no backend deve ser **listada e documentada** para ser repassada a ele. O foco das ações de desenvolvimento automatizado deve ser 100% no Front-end (React/Electron).

### 6. Formulários Premium e Campos Específicos
- **Uso de Som de Clique (useClickSound):** Todos os botões, checkboxes e elementos interativos clicáveis criados ou modificados no sistema devem obrigatoriamente utilizar o hook `useClickSound` para reproduzir o som de clique padrão do sistema, garantindo um feedback tátil auditivo premium condizente com a experiência de sistema operacional.
- **Tratamento de Placas e Chassis:** Sempre aplicar a transformação para caixa alta (`toUpperCase()`) no evento `onChange` para garantir consistência visual premium e evitar erros de digitação.
- **Indicação de Obrigatoriedade:** Sempre adicionar um asterisco (`*`) ao lado do label dos campos obrigatórios (ex: "Marca *").
- **Aba de Veículos para Clientes (Oficina):** Clientes podem possuir múltiplos veículos vinculados de forma dinâmica na aba correspondente, permitindo o preenchimento de Ordens de Serviço subsequentes de forma ágil sem duplicar registros de pessoas.
- **Uso de Máscaras:** Sempre formatar documentos (CPF/CNPJ) dinamicamente usando os utilitários de formatação (ex: `formatCpfOrCnpj`).

### 7. Padrão de Abas e Formulários Premium (Aba Principal, Endereçamento e Variações)
- **Aparência Visual Ríspida e Premium**:
  - Utilizar contêineres de cartões (`sectionCard`) com fundos suaves que reagem perfeitamente ao tema Dark/Light (`rgba(255,255,255,0.03)` no Dark e `background.primary` no Light).
  - Adicionar cabeçalhos de seção (`sectionHeader`) acompanhados de um ícone do sistema (Feather Icons/`react-icons/fi`) envolto em um círculo colorido semitransparente correspondente ao contexto (ex: verde para preços, roxo para fornecedor, azul para identificação). **Nunca usar emojis** gráficos como ícones.
  - Usar fontes de sistema macOS fiéis (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
- **Cards de Destaque e Feedback Dinâmico**:
  - Para campos que interagem entre si (como Preço de Custo, Margem e Preço de Venda), utilizar cartões individuais com bordas e fundos dinâmicos baseados no estado (ex: se o preço de venda é calculado automaticamente, destacar o contêiner com borda azul e um badge com o rótulo `auto` ou o lucro real em verde `+R$ X,XX`).
  - Para campos com sufixos ou unidades (como Margem `%`), colocar o símbolo de forma estática e absoluta dentro do fluxo do input para evitar loops de digitação ou formatações redundantes.
- **Grids e Tabelas de Itens Adicionais**:
  - Grids interativos (como o mapa de estante/endereçamento) devem ser desenhados com células clicáveis e alinhadas de forma perfeita verticalmente e horizontalmente. Rótulos e divisores devem respeitar offsets perfeitos para manter alinhamento inquebrável.
  - Listagens e tabelas de itens adicionados dinamicamente (como unidades de medida secundárias) devem ter cabeçalho com fundo sutil, linhas zebradas para contraste em ambos os temas, e botões de ação limpos e minimalistas (como lixeira vermelha para remoção).

## 8. Integridade e Resolução de Caminhos de Importação (Evitando Quebras de Build)
- **Nunca adivinhar caminhos de importação**: Antes de importar qualquer componente, utilitário ou hook, verifique fisicamente onde o arquivo está localizado na árvore de diretórios do projeto para evitar erros. (Exemplo: o componente `AddButton` está na raiz global de componentes `src/renderer/components/AddButton/AddButton.tsx`, e não aninhado em outros modais).
- **Cálculo rigoroso de níveis relativos (`..`)**: Preste extrema atenção no nível de aninhamento do arquivo atual para calcular as subidas de diretório.
  - Para arquivos em subpastas de página (ex: `src/renderer/pages/NomeDaPagina/components/Arquivo.tsx`):
    - Subir 3 níveis (`../../../`) leva à pasta principal de renderer (`src/renderer/`), onde estão as pastas `components/`, `styles/`, `hooks/` e `utils/`.
    - Subir 4 níveis (`../../../../`) é um erro comum e tentará buscar caminhos fora do diretório da aplicação.
- **Validação de Compilação Obrigatória**: Toda vez que um novo arquivo for criado, importações modificadas ou rotas adicionadas, **DEVE** ser rodado o comando de compilação `npx tsc --noEmit --skipLibCheck` no terminal e verificado se a build concluiu com sucesso (Exit Code: 0) antes de entregar a tarefa.

## 9. Sistema de Notificações Global (Toasts)
- **Componente e Hook Global (`useToast`)**: Sempre utilizar o hook customizado `useToast` (definido em `src/renderer/components/Toast/Toast.tsx`) para exibir notificações temporárias ao usuário (como salvamento com sucesso, alertas de erro, avisos ou feedbacks de ações em Dialogs/Modais), ao invés de usar `alert()` nativo ou implementar estados locais de banner ou toast.
- **Feedback em Telas com Dialogs (CRÍTICO)**: Sempre que uma tela contiver diálogos (Modais, Confirmações, Dialogs), qualquer resposta visual de ação realizada (ex: excluir, salvar, alterar status) **deve** usar o `useToast` para exibir o feedback de sucesso, erro ou alerta de forma homogênea e não intrusiva.
- **Tipos de Notificações**: Suporta `success`, `error`, `warning` e `info`.
- **Exemplo de uso**:
  ```typescript
  import { useToast } from '../../../components/Toast';
  const toast = useToast();
  // ...
  toast.success('Modelo salvo com sucesso!');
  toast.warning('Aviso importante.');
  ```
- **Aparência e Estilo**: O provedor renderiza as mensagens de forma empilhada com animação de fade-in no canto inferior direito da tela, usando os estilos definidos em `systemStyle.ts` (`systemStyles.toast.container`).

## 10. Uso Obrigatório de Skills Técnicas (CRÍTICO)
- **Seguir as Skills de Electron e TypeScript:** Ao trabalhar no desenvolvimento do projeto NETCOM (que utiliza Electron, Vite, React e TypeScript), a inteligência artificial / desenvolvedor deve obrigatoriamente seguir e aplicar as diretrizes, padrões e boas práticas descritas nas skills oficiais de:
  - [electron-development.md](file:///c:/WORKSPACE/netcom-front/obsidian/brain/skills/electron-development.md): Padrões de IPC seguro, ciclo de vida da aplicação, isolamento de contexto e segurança no processo principal e de renderização.
  - [typescript-expert.md](file:///c:/WORKSPACE/netcom-front/obsidian/brain/skills/typescript-expert.md): Padrões avançados de tipos, verificação estrita de tipagem, prevenção de erros e estruturação de interfaces seguras.
- **Seguir as Skills de Sistemas de Memória:** Para manter a consistência contínua entre agentes, sessões e chats, utilize e aplique os padrões estruturados nas seguintes skills:
  - [agent-memory-systems.md](file:///c:/WORKSPACE/netcom-front/obsidian/brain/skills/agent-memory-systems.md): Arquitetura de memórias semânticas, episódicas e procedimentais.
  - [mesh-memory.md](file:///c:/WORKSPACE/netcom-front/obsidian/brain/skills/mesh-memory.md): Lógica de busca semântica, integração MCP e auto-tagging.
  - [conversation-memory.md](file:///c:/WORKSPACE/netcom-front/obsidian/brain/skills/conversation-memory.md): Padrões técnicos de controle de contexto e ciclo de vida de memórias.

## 11. Gestão Proativa de Ecossistema e Dependências (CRÍTICO)
- **Visão Arquitetural Sênior**: Ao introduzir, atualizar ou sugerir **QUALQUER** biblioteca, módulo (nativo ou não), framework ou ferramenta de build no projeto, a Inteligência Artificial DEVE obrigatoriamente prever todo o ciclo de vida dessa dependência na máquina de outros desenvolvedores ou em ambientes de CI/CD.
- **Configuração Completa "Out-of-the-box"**: Isso significa configurar proativamente scripts de `postinstall` (como recompilação de módulos nativos do Electron via `electron-builder install-app-deps`), declarações de tipos (`@types/*`), variáveis de ambiente exigidas, modificações em `vite.config.ts` e arquivos de `tsconfig.json`.
- **Prevenção vs Correção**: O objetivo é blindar a aplicação. É **inadmissível** que o projeto quebre logo após um `npm install` limpo devido à falta de planejamento de compilação ou incompatibilidade de versões (ex: erros de `NODE_MODULE_VERSION`, ausência de binários, etc). O ambiente de desenvolvimento deve estar perfeitamente roteirizado nos scripts do `package.json`.

## 12. Arquitetura Offline-First e Conexão Local (SQLite)
- **Prioridade de Leitura (Fallback)**: Telas que carregam dados críticos (como `CompanyForm`, `Clients`, `Products`) DEVEM tentar ler os dados prioritariamente do banco local (`useLocalDb()`) para garantir resposta imediata e funcionamento sem internet. O fallback para a requisição `apiGet` só deve ocorrer se o banco local retornar nulo ou não estiver disponível.
- **Estruturação de Dados JSON**: Quando o banco local baixar dados da API que contenham chaves secundárias ou relações não mapeadas nas colunas primárias do SQLite, esses dados extras devem ser injetados em uma coluna `data_json` para que o frontend não perca nenhuma informação necessária ao renderizar o formulário localmente (como `cityIbge`, `cnae` etc).
- **Proteção de Estados de UI (Try-Catch)**: Em chamadas de leitura (tanto locais quanto de API), o carregamento `isLoading` deve ser gerido de forma segura com `try/catch/finally`. Nunca deixe a interface quebrar ou ficar em loop infinito ("Carregando...") caso o banco local dispare um erro interno (ex: banco corrompido) ou a API retorne `ECONNREFUSED`. Em caso de erro, a UI deve ser silenciada graciosamente e liberar o acesso (usando `toast.error` se necessário).
- **Hooks de Banco de Dados**: A interface de conexão local nunca deve ser instanciada diretamente nos componentes React. Deve-se expor os métodos do SQLite via IPC no Node e criar as funções correspondentes no hook global `useLocalDb.ts`. O acesso via hook previne quebras de contexto e facilita o gerenciamento do estado `isAvailable`.
