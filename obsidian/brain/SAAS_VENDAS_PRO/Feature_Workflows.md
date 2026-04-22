# Fluxos de Negócio (Workflows)

## 📍 Cobranças e Viagens (Trips)

Uma **Cobrança** (ou Viagem) representa o período em que um vendedor está fisicamente em uma rota atendendo clientes.

1. **Abertura**: O vendedor inicia uma nova viagem vinculada a uma Rota. A regra de negócio impede múltiplas viagens "em andamento" na mesma rota simultaneamente.
2. **Operação e Persistência**:
   - Durante a viagem, o estado é persistido no dispositivo. Se o app for fechado, ele abrirá diretamente na tela de gestão da viagem ativa.
   - O grid de ações inclui: Clientes, Despesas, Depósitos, Produtos e Relatórios.
3. **Encerramento**: Ao clicar em "Encerrar Viagem" (footer da tela de detalhes):
   - O status no backend muda para `encerrada`.
   - Todas as fichas abertas durante essa viagem que ainda estão como `nova` são automaticamente transicionadas para `pendente`.
   - O estado local (`activeTrip`) é limpo e o usuário retorna para a lista de viagens da rota.

## 📄 Ciclo de Vida da Ficha (Sales File)

O status da ficha governa sua visibilidade e cálculos financeiros:

- **Pedido**: Apenas uma pré-venda. Não soma no faturamento total nem no saldo devedor do cliente.
- **Nova**: Venda realizada na viagem atual. Ainda não foi "efetivada" para o ciclo de cobrança regular.
- **Link Gerado**: Status intermediário quando um link de pagamento externo foi criado.
- **Pendente**: Ficha confirmada que possui saldo devedor. Aparece no dashboard de cobranças pendentes.
- **Paga**: Ficha cujo valor total foi coberto por pagamentos lançados.

## 👥 Visão de Cliente (Client Drill-down)

A visão detalhada consolida a saúde financeira do cliente:

- **Total Vendido**: Soma de todas as fichas (`nova`, `pendente`, `paga`, `link_gerado`). **Exclui Pedidos**.
- **Valor Lançado**: Soma de todos os pagamentos vinculados às fichas do cliente.
- **Saldo em Aberto**: Valor das fichas que ainda não foram migradas para `paga` (Novas + Pendentes).
- **Restante Devedor**: `Total Vendido` - `Valor Lançado`. Representa o quanto o cliente ainda deve na vida útil.

## 🔄 Sincronização Offline (Offline-First)

Para garantir operação contínua em locais sem internet, o app utiliza um motor de sincronização automática:

1. **Persistência Local**: Toda ação (criar cliente, ficha, pagamento) é gravada imediatamente no SQLite local. A interface atualiza instantaneamente.
2. **Fila de Mutação**: O sistema enfileira o comando de API correspondente na `sync_queue`.
3. **Sincronização em Background**: O `useSync` monitora a conexão. Ao detectar internet, o `SyncService` processa a fila sequencialmente (FIFO), garantindo a integridade dos dados no servidor.
4. **Master Data Cache**: O app mantém uma cópia local de Clientes e Produtos, atualizada periodicamente para evitar dependência de rede durante a navegação.

## ➕ Fluxo de Criação de Ficha (Novo Pedido)

O botão de ação flutuante (FAB) na aba de "Novas" de um cliente dispara o seguinte processo:

1. **Geração de Identidade**: O app gera um `id` tipo UUID e um `code` sequencial baseado no vendedor, data e rota.
2. **Registro Local**: A ficha é inserida na tabela `cards` do SQLite local com status `nova` e total `0`.
3. **Enfileiramento**: Uma ação `POST_FICHA` é adicionada na `sync_queue`.
4. **Adição de Itens**: Ao navegar para o detalhe da ficha e adicionar produtos, cada item gera uma ação `POST_ITEM` na fila, vinculada ao UUID da ficha.
5. **Efeito Cascata**: O motor de sincronismo garante que a ficha seja criada no servidor ANTES dos itens (ordem cronológica da fila).
