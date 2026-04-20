# Padrões de Código e Decisões de Design

## 🛠️ Padrões de Desenvolvimento

- **Schema First**: Sempre definir o schema no Drizzle (`server/src/db/schema/tenant.ts`) antes da lógica.
- **Transacional**: Operações críticas DEVEM usar `db.transaction`.
- **Modularização Mandatória**: Todos os projetos DEVEM ser 100% modularizados e componentizados. NUNCA criar arquivos gigantes ou lógicas centralizadas em componentes de visualização. O objetivo é manter o máximo desempenho, organização e facilidade de manutenção.
- **Aesthetics Matters**: Design premium com Tailwind, linhas finas e tipografia limpa.

## 🏛️ Decisões Arquiteturais

- **Backend**: Fastify com isolamento físico por tenant (DB-per-tenant).
- **Web**: Atomic Design e arquitetura baseada em abas.
- **Mobile**: React Native com Expo.
- **Isolamento**: Uso de header `x-tenant-slug` para roteamento dinâmico de DB.

## 🧠 Aprendizados de UI/UX

- **Modais**: Padronização para evitar "double headers". Desabilitar o header nativo do Stack no Expo Router e usar o `ModalHeader` customizado.
- **Estética**: Manter o uso de vidromorfismo (glassmorphism) e animações suaves.
- **Responsividade**: Padrão Sidebar mobile (`fixed -translate-x-full lg:relative lg:translate-x-0`).

## 📱 Boas Práticas Mobile (Expo)

- **Componentização de Telas**: Telas grandes DEVEM ser divididas em abas/componentes específicos por funcionalidade (`tabs` ou `components/features`) para otimizar a performance e legibilidade do código.
- **Custom Hooks**: Toda lógica de busca de dados, mutações e estados complexos de telas DEVEM ser extraídos para custom hooks (ex: `useCardDetail`, `useNewCard`).
- **Navegação Linear**: Para garantir consistência em reloads e deep links, o `_layout.tsx` centraliza os overrides do botão voltar, garantindo o retorno ao contexto anterior correto em vez de apenas desempilhar a rota nativa.
- **Preservação de Contexto**: Navegações entre telas de contexto (ex: de cliente para ficha) DEVEM sempre passar `clientName` e `routeName` via params para evitar estados em branco (blanks) durante o carregamento inicial.

## 🛜 Arquitetura Offline-First (Local-First)

- **Local Persistence (SQLite)**: O aplicativo utiliza `expo-sqlite` para manter um cache persistente de dados críticos (clientes, produtos, fichas e pagamentos). A UI DEVE ler preferencialmente do banco local para garantir resposta instantânea.
- **Sync Engine (Queue Based)**: Toda mutação de dados (criação de cliente, ficha ou pagamento) DEVE ser salva localmente primeiro e depois enfileirada no `SyncService` (`sync_queue`).
- **Data Durability**: O estado local é a "source of truth" imediata para o vendedor no campo. O `SyncService` garante que, ao recuperar a conexão, as operações sejam enviadas ao servidor na ordem correta (FIFO).
- **Indicadores de Status**: A interface DEVE sempre exibir o estado de conectividade e o número de itens pendentes na fila de sincronização para dar previsibilidade ao usuário.
- **UUID Generation**: Todas as novas entidades criadas localmente (Clientes, Fichas, Itens, Pagamentos) DEVEM usar `SyncService.generateUUID()` (baseado em `expo-crypto`) para garantir IDs únicos e válidos no PostgreSQL, evitando erros de sintaxe durante a sincronização.
- **UUID Fallbacks no Backend**: O Drizzle ORM tem a tendência de auto-gerar UUIDs (sobrescrevendo IDs do mobile) quando o ID não é forçado diretamente no bloco `values`. Em rotas de sincronização local-first, o backend _deve forçar_ a inserção do ID enviado originado no SQLite (`id: req.body.id || fallback()`) ou as chaves estrangeiras entre as tabelas serão corrompidas no servidor.
- **Master Data Scope**: O download inicial de dados (`downloadMasterData`) deve incluir obrigatoriamente `routes` e `cobrancas` (trips) para que a navegação básica e o contexto da rota ativa funcionem sem internet.

## 📦 Gestão de Estoque

- **Dualidade de Estoque**: O sistema distingue rigidamente entre **Estoque Depósito** (saldo global no galpão) e **Estoque Vendedor** (saldo em posse do vendedor na viagem/cargo).
- **Mobile Scope**: O aplicativo mobile DEVE exibir e sincronizar exclusivamente o **Estoque do Vendedor** logado. A venda offline depende da precisão deste saldo local.
- **Sincronização de Saldo**: O `downloadMasterData` deve sempre passar o `sellerId` explícito para a API de produtos (`/api/products?sellerId=...`). Se omitido em background, a API exportará o depósito global (que pode ser `0`) e apagará inadvertidamente o banco de dados local do vendedor.
- **Dedução Virtual de Estoque**: Para fornecer limites de quantidade ao vivo sem corromper o banco SQLite (caso um usuário feche o aplicativo ou cancele o lançamento a meio do processo), o estoque exibido no app ao escolher um produto é deduzido _virtualmente em memória_. O `ProductSelectionModal` recebe `currentCartItems` e calcula visualmente o máximo disponível em tempo real, postergando o `UPDATE` real no SQLite apenas para o momento final (`FINALIZAR`).

## 🤝 Protocolo de Interação e Git

- **Controle Total do Usuário**: O Agente NUNCA deve realizar `git commit` ou `git push` automaticamente sem o comando explícito do usuário.
- **Mobile Theming (Light/Dark Mode)**: O aplicativo DEVE suportar troca automática entre temas claro e escuro. Use obrigatoriamente o hook `useThemeColor` em conjunto com a paleta semântica definida em `constants/Colors.ts`. NUNCA use cores hexadecimais (hardcoded) diretamente nos estilos dos componentes. Prefira sempre encapsular `View` e `Text` nos wrappers `DefaultView` e `DefaultText` (importados de `theme/Themed`) para garantir a consistência do sistema de temas em todo o app.
- **Sincronização de Aprendizado**: Sempre que uma nova regra de negócio, decisão técnica ou padrão de código for estabelecido, o vault `brain` deve ser atualizado IMEDIATAMENTE antes de encerrar o turno.
