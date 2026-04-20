# Decisões e Correções - SAAS_VENDAS_PRO

## 🧠 Aprendizados Recentes

### Estoque (Inventory)

- **Saldo Não Negativo**: Implementada validação para garantir que o estoque nunca fique abaixo de zero (nível depósito e vendedor). Adicionadas constraints no DB.
- **Auditoria**: Toda entrada/saída deve registrar logs detalhados em `inventory_movements`.

### Financeiro

- **Configurações**: Suporte para juros simples/compostos e multas fixas parametrizáveis por tenant.
- **Valores Monetários**: Todos os valores são armazenados como INTEGRAL (centavos) no banco de dados. O frontend DEVE converter usando `formatCentsToBRL` (@/utils/money).

### Erros de Runtime e Fixes

- **Dashboard Travado**: Corrigido `useEffect` que não invocava `initDashboard`.
- **API Stats 404**: Implementada rota `/api/stats/insights` para métricas do dashboard.
- **Contador de Vendas**: Adicionado suporte a metadados de paginação e `ordersCount` no backend.
- **Sincronização de Ambiente**: Em caso de mudanças de schema no DB, é obrigatório **reiniciar os terminais** e **limpar o cache do editor** (fechar e abrir arquivos) para evitar falsos erros de módulo ou tipos.

### Mobile & Navegação

- **Navegação Hierárquica Estrita**: Evoluída para priorizar `router.back()` para animações ("book page") nativas, mas com fallback obrigatório para mapeamento manual (`handleBack`) para evitar loops ou saídas acidentais do contexto `(main)` para a tela de `Setup`.
- **Animações Nativas**: Removida animação fixa `slide_from_right` das `screenOptions` do Stack para permitir que o SO gerencie a inversão natural (pop) ao voltar.
- **Persistência de Sessão (Auto-Resume)**: O app agora persiste a `activeTrip` no `AsyncStorage`. No carregamento, se houver viagem ativa, o usuário é redirecionado automaticamente.
- **Guarda de Redirecionamento (hasResumed)**: Adicionada flag no root layout para garantir que o redirecionamento automático ocorra apenas uma vez por sessão, permitindo que o usuário volte ao menu principal sem ser "puxado" de volta para a viagem ativa repetidamente.

### Layout & Responsividade (Web Dashboard)

- **Eliminação de JS no Layout**: Removido o uso de `window.innerWidth` no render do React para evitar inconsistências de hidratação e "saltos" de layout.
- **Grid CSS Nativo**: Migrada a lógica de visibilidade do Sidebar para classes 100% CSS (`lg:relative`, `hidden lg:block`), garantindo que o Sidebar sempre reserve espaço no grid desktop e não sobreponha o conteúdo (evitando o "vazamento" de páginas).

### Performance (App Mobile)

- **Passagem de Contexto via Params**: Otimizada a transição entre telas ao passar metadados (como nome da rota e código) via parâmetros do router, permitindo renderização instantânea (zero-spinner) enquanto dados complementares são buscados em background.
- **Background Fetching**: Requisições de detalhe agora rodam em paralelo ou são ignoradas se os dados já vieram via parâmetros, maximizando a percepção de velocidade pelo usuário.

### UI & UX (App Mobile)

- **Estabilidade de Foco**: Sub-componentes de input (ex: `InputField`) devem ser definidos FORA da função principal de renderização para manter referências estáveis, prevenindo que o teclado feche ao atualizar o estado (bug de re-render).
- **Componentes Nativos**: Proibido o uso de tags HTML (`div`, `header`, `footer`) em arquivos `.tsx` do mobile; usar sempre `View` para garantir compatibilidade com o motor do React Native.

### Segurança e Isolamento Multi-Tenant (Auth Nativo)

- **Fim do Clerk & localStorage**: O sistema foi migrado para um **Auth Nativo (JWT)**. É PROIBIDO usar Clerk hooks ou `localStorage` para persistência de tenant. O estado de autenticação deve vir exclusivamente do `AuthContext` (web) ou `AuthStore` (mobile).
- **Validação Server-Side**: O isolamento agora é garantido pelo vínculo entre `master_users` e `tenants` via `tenant_id` no banco de dados Master. Se um usuário não tiver `tenant_id`, ele é guiado para o fluxo de setup.
- **Identidade do Dono**: Coluna `owner_clerk_id` foi **REMOVIDA**. Agora usamos `owner_id` (UUID) que referencia a tabela `master_users`.

### Fluxo de Onboarding (Sistema Nativo)

1. **Email & Senha**: Cadastro inicial na tabela `master_users` (Banco Master).
2. **Dados da Empresa**: Coleta de Nome, CPF e Endereço.
3. **Provisionamento**: Criação automática do banco de dados do tenant (`vendas_slug`) e inserção do dono como usuário `admin` no banco isolado.
4. **Vinculação**: O `tenant_id` do novo tenant é gravado no registro do usuário no banco Master para permitir logins subsequentes.

### Sincronização de Schema (Post-Clerk)

- **Remoção de Constraints Antigas**: Sempre que migrar um sistema legado de auth, verifique as constraints `NOT NULL`. A coluna `owner_clerk_id` em `tenants` foi removida por causar falhas de inserção no novo fluxo.
