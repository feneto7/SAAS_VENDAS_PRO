# 📊 Banco de Dados e Provisionamento

Este documento detalha o funcionamento do banco de dados multi-tenant, o processo de criação de novas empresas e os schemas de tabelas com granularidade total.

## 🏛️ Sistema Multi-tenant (Database-per-tenant)

O sistema utiliza isolamento físico de dados. Cada empresa (tenant) possui seu próprio banco de dados PostgreSQL independente.

### 🔄 Processo de Criação de Tenant (Provisioning)

Localizado em: `server/src/db/provisioning.ts`

1.  **Slugification**: O nome da empresa é convertido em um slug (ex: "Minha Loja" -> "minhaloja").
2.  **Criação de DB**: É criado um novo banco de dados no PostgreSQL com o nome `vendas_{slug}`.
3.  **Migrações**: São executados todos os arquivos SQL da pasta `server/drizzle/tenant` para criar a estrutura de tabelas.
4.  **Seeding**: São inseridos os dados iniciais obrigatórios (veja seção Seeds).
5.  **Usuário Mestre**: O dono da empresa é inserido na tabela `users` do novo banco com a role `admin`.
6.  **Registro Master**: A nova empresa e o vínculo com o usuário são registrados no banco de dados central (`master`).

---

## 🌱 Seeds Geradas (Dados Iniciais)

Sempre que um tenant é criado, os seguintes dados são gerados automaticamente:

### Métodos de Pagamento

Tabela: `payment_methods`

- Dinheiro
- PIX
- Cartão de Crédito
- Cartão de Débito
- Transferência
- Outro

---

## 🗄️ Estrutura do Banco Master (Central)

Gerencia a autenticação global e o roteamento de tenants para os bancos físicos.

### `tenants` (Global)

- `id`: UUID (Primary Key).
- `name`: Nome oficial da empresa.
- `slug`: Identificador único para URLs e roteamento de headers.
- `dbName`: Nome físico literal do banco de dados no PostgreSQL.
- `ownerId`: UUID do usuário dono (referencia `master_users.id`).
- `ownerName`: Nome do responsável legal.
- `ownerCpf`: CPF do responsável legal.
- `street`: Nome da rua da sede.
- `number`: Número do endereço.
- `neighborhood`: Bairro.
- `city`: Cidade.
- `state`: Estado (UF).
- `zipCode`: CEP.
- `contact`: Telefone ou e-mail de contato principal da empresa.
- `status`: Estado atual da empresa [active, suspended, trial].
- `createdAt`: Data/Hora de criação do tenant.
- `updatedAt`: Data/Hora da última atualização cadastral.

### `master_users` (Global)

- `id`: UUID (Primary Key).
- `name`: Nome completo do usuário.
- `email`: E-mail único usado para login global.
- `passwordHash`: Hash seguro da senha (Argon2/Bcrypt).
- `tenantId`: FK opcional para a empresa vinculada (referencia `tenants.id`).
- `createdAt`: Data/Hora de registro.
- `updatedAt`: Data/Hora da última alteração de perfil.

---

## 🏢 Estrutura do Banco do Tenant (Empresa)

Tabelas geradas dentro de cada banco de tenant específico para isolamento total.

### 👤 Usuários e Acesso

#### `users`

- `id`: UUID (Primary Key).
- `code`: Inteiro auto-incremental para identificação visual e interna.
- `name`: Nome completo do funcionário/vendedor.
- `email`: E-mail de acesso específico do tenant.
- `role`: Nível de permissão [admin, manager, seller].
- `appCode`: Identificador (até 12 dígitos) para login no app mobile.
- `passwordHash`: Hash da senha de acesso.
- `webAccess`: Booleano indicando se o usuário pode acessar o painel web.
- `phone`: Telefone de contato.
- `active`: Booleano para ativar/desativar o acesso.
- `createdAt`: Data de contratação/registro.

### 📦 Produtos e Estoque

#### `products`

- `id`: UUID (Primary Key).
- `sku`: Código único de estoque.
- `name`: Nome ou descrição curta do produto.
- `description`: Detalhes técnicos ou observações longas.
- `category`: Categoria do produto.
- `brand`: Marca/Fabricante.
- `stockDeposit`: Saldo atual disponível no depósito central.
- `costPrice`: Preço de custo (em centavos).
- `priceCC`: Preço de venda Com Comissão (em centavos).
- `priceSC`: Preço de venda Sem Comissão (em centavos).
- `active`: Controle de visibilidade nas vendas.
- `createdAt`: Data de cadastro do item.

#### `seller_inventory`

- `id`: UUID (Primary Key).
- `sellerId`: FK para o vendedor dono desta carga (referencia `users.id`).
- `productId`: FK para o produto (referencia `products.id`).
- `stock`: Saldo atual em posse do vendedor (Carga).
- `updatedAt`: Última atualização de saldo.

### 📍 Logística e Vendas

#### `routes`

- `id`: UUID (Primary Key).
- `code`: Inteiro auto-incremental da rota.
- `name`: Nome identificador da rota (ex: "Centro", "Rota Sul").
- `description`: Notas sobre a região ou particularidades da rota.
- `periodicity`: Intervalo de dias planejado para visitas.
- `active`: Status da rota.

#### `clients`

- `id`: UUID (Primary Key).
- `code`: Inteiro auto-incremental do cliente.
- `name`: Razão Social ou Nome Completo.
- `cpf`: CPF ou CNPJ do cliente.
- `nickname`: Nome Fantasia ou como o cliente é conhecido.
- `phone`: Telefone principal.
- `phone2`: Telefone secundário.
- `street`: Endereço de entrega/cobrança.
- `number`: Número.
- `neighborhood`: Bairro.
- `city`: Cidade.
- `state`: Estado.
- `zipCode`: CEP.
- `referencePoint`: Ponto de referência para facilitar a entrega.
- `comment`: Observações internas sobre o cliente.
- `routeId`: FK para a rota onde o cliente está alocado (referencia `routes.id`).
- `active`: Status do cliente.

#### `cobrancas` (Viagens/Cargas)

- `id`: UUID (Primary Key).
- `code`: Inteiro auto-incremental da viagem.
- `routeId`: FK para a rota da viagem (referencia `routes.id`).
- `sellerId`: FK para o vendedor responsável (referencia `users.id`).
- `status`: Estado da viagem [aberta, encerrada].
- `startDate`: Data/Hora de início da viagem.
- `endDate`: Data/Hora de fechamento da carga.

### 🃏 Fichas e Financeiro

#### `fichas` (Vendas)

- `id`: UUID (Primary Key).
- `code`: Identificador único da venda (`users.code` + Data + Rota).
- `status`: Ciclo de vida da ficha [nova, pendente, paga, link_gerado, pedido].
- `total`: Valor líquido total a pagar pelo cliente (em centavos).
- `notes`: Observações gerais da venda.
- `saleDate`: Data efetiva em que o produto foi deixado/vendido.
- `clientId`: FK do cliente comprador (referencia `clients.id`).
- `sellerId`: FK do vendedor que realizou a venda (referencia `users.id`).
- `routeId`: FK da rota ativa no momento (referencia `routes.id`).
- `cobrancaId`: FK da viagem/carga vinculada (referencia `cobrancas.id`).
- `linkToken`: Token único para compartilhamento e visualização externa.
- `discount`: Valor de desconto monetário aplicado na ficha.
- `commissionPercent`: Percentual de comissão definido para produtos "CC" nesta ficha.
- `itemsLocked`: Booleano indicando se a conferência de produtos foi encerrada.
- `lastManualUpdate`: Timestamp da última alteração local (usado para Guard de Sync).

#### `ficha_items` (Itens da Venda)

- `id`: UUID (Primary Key).
- `fichaId`: FK para a ficha pai (referencia `fichas.id`).
- `productId`: FK para o produto vendido (referencia `products.id`).
- `quantity`: Quantidade de produtos deixada originalmente com o cliente.
- `quantitySold`: Quantidade confirmada como vendida no momento do acerto.
- `quantityReturned`: Quantidade de itens devolvidos ao vendedor.
- `informed`: Booleano indicando se o item já foi conferido no acerto.
- `unitPrice`: Preço unitário praticado para este item na venda.
- `subtotal`: Valor total calculado do item (em centavos).
- `commissionType`: Tipo de comissão do item [CC (Com Comissão), SC (Sem Comissão)].

#### `payments` (Lançamentos Financeiros)

- `id`: UUID (Primary Key).
- `fichaId`: FK para a ficha relacionada (referencia `fichas.id`).
- `methodId`: FK para a forma de pagamento (referencia `payment_methods.id`).
- `amount`: Valor exato do pagamento recebido (em centavos).
- `paymentDate`: Data e Hora em que o valor foi recebido.
- `cancelled`: Booleano para identificar estornos ou erros de lançamento.
- `cancelledAt`: Data/Hora do cancelamento do pagamento.

---

### 🔗 Tabelas Auxiliares de Vínculo

#### `user_routes`

Tabela de intersecção para gerenciar quais rotas cada vendedor pode visualizar.

- `id`: UUID (Primary Key).
- `userId`: FK do vendedor (referencia `users.id`).
- `routeId`: FK da rota (referencia `routes.id`).

#### `inventory_movements` (Log de Auditoria)

Cabeçalho do registro de movimentação de estoque.

- `id`: UUID (Primary Key).
- `type`: Motivo da mudança [entrada_estoque, ajuste_manual].
- `description`: Texto livre explicando o motivo da movimentação.
- `sellerId`: FK opcional (referencia `users.id`) - NULL se for movimentação no depósito geral.

#### `inventory_movement_items` (Detalhes do Log)

Linhas detalhadas de cada movimentação de estoque.

- `id`: UUID (Primary Key).
- `movementId`: FK para o cabeçalho (referencia `inventory_movements.id`).
- `productId`: FK para o produto afetado (referencia `products.id`).
- `quantityBefore`: Saldo que existia antes da operação.
- `quantityAfter`: Saldo final após a operação.
- `quantityChange`: Valor da variação (positivo ou negativo).
