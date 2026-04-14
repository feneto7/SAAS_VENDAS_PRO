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
