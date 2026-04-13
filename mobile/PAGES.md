# Mapeamento de Telas - VENDAS Mobile

Este documento descreve a finalidade de cada arquivo no diretório `mobile/app`, mapeando-os para as telas e funcionalidades do aplicativo.

## Estrutura Global

- **\_layout.tsx**: Layout raiz do aplicativo. Gerencia os provedores de contexto (Auth, Tenant) e controla os redirecionamentos globais (Login, Setup, Dashboard).
- **setup.tsx**: Tela inicial de configuração. Onde o vendedor insere o "Código da Empresa" (Tenant Slug).
- **login.tsx**: Tela de login. Onde o vendedor insere seu usuário e senha.
- **modal.tsx**: Uma tela de modal genérica, utilizada para fluxos rápidos.
- **+html.tsx**: Arquivo técnico do Expo para inicialização de web (SSR).
- **+not-found.tsx**: Tela exibida quando uma rota inválida é acessada (404).

## Grupo Principal ((main))

Localizado em `mobile/app/(main)`, este grupo contém todas as telas acessíveis após o login.

### Layout e Navegação

- **(main)/\_layout.tsx**: Layout principal das telas autenticadas. Define o cabeçalho (Header) com o botão de voltar inteligente e o título dinâmico.

### Fluxo de Gerenciamento

- **(main)/index.tsx (Dashboard)**: A primeira tela após o login. Contém os botões principais: "Minhas Rotas" e "Produtos".
- **(main)/routes.tsx**: Lista as rotas disponíveis para o vendedor.
- **(main)/collections/[id].tsx**: Lista as "Cobranças" (viagens) vinculadas a uma rota específica. Abre ao selecionar uma rota.
- **(main)/collection-detail/[id].tsx (Detalhe da Cobrança)**: A "Central" da viagem. Exibe o nome da rota, número da viagem e botões para:
  - **Clientes**: Acessar a lista de clientes para venda.
  - **Despesas**: Registrar gastos da viagem.
  - **Depósitos**: Ver movimentações de estoque.
  - **Produtos**: Ver estoque da viagem.
  - **Relatórios**: Ver resumos.
  - **Encerrar Viagem**: Finalizar a jornada.

### Fluxo de Venda (Ficha)

- **(main)/clients.tsx**: Lista de busca de clientes vinculados à viagem atual.
- **(main)/client-detail/[id].tsx**: Perfil detalhado de um cliente, exibindo histórico de débitos e fichas anteriores.
- **(main)/new-card/[clientId].tsx**: O "coração" da operação. Formulário para criar uma nova venda/cobrança (Ficha), com seleção de produtos, valores e pagamentos.
- **(main)/card-detail/[id].tsx**: Tela para visualizar (ou editar) os detalhes de uma cobrança já realizada (Ficha).
- **(main)/order-detail/[id].tsx**: Detalhes técnicos de um pedido vinculado a uma cobrança.

### Catálogo

- **(main)/products.tsx**: Visualização rápida do estoque geral e catálogo de produtos do vendedor.
