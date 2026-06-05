# Estruturação de Relatórios de Cobrança e Movimentação de Estoque (Server)

Esta implementação visa atualizar a modelagem do banco de dados (Drizzle ORM) no servidor para suportar a geração de relatórios avançados e detalhados por cobrança (viagem), incluindo controle rigoroso de estoque, clientes novos, recebimentos e status das fichas.

> [!IMPORTANT]
> **Revisão do Usuário Necessária**
> Por favor, leia atentamente as mudanças propostas no schema e responda às **Perguntas em Aberto** antes de prosseguirmos com a codificação.

## Perguntas em Aberto

1. **Snapshot de Estoque:** Para sabermos a "quantidade exata que o vendedor tinha ao iniciar a cobrança", a forma mais performática é criar uma tabela de "fotografia" (`cobranca_inventory_snapshots`) que salva o estoque do vendedor no exato momento em que o status da cobrança muda para `aberta`. Você concorda com essa abordagem ou prefere que o sistema calcule isso retroativamente lendo todo o histórico de movimentações? *(Recomendo fortemente a tabela de snapshot para garantir relatórios rápidos e à prova de falhas).*
2. **Sincronismo Offline (Mobile/Web):** O escopo atual desta tarefa é apenas alterar o schema no `server` e gerar a migration? Lembrese que, devido à arquitetura *Offline-First* (citada no `PADRAO.md`), após alterarmos o servidor, precisaremos futuramente atualizar as tabelas do SQLite local no `mobilev2` e no `web` para que eles possam enviar e receber essas novas colunas. Podemos focar 100% no servidor agora?

## Mudanças Propostas

O plano modificará o arquivo `server/src/db/schema/tenant.ts`.

### 1. Tabela `fichas`
Para rastrear exatamente quando o status mudou (nova -> pendente) e quando foi paga:
- **[MODIFY]** Adicionar coluna `statusUpdatedAt` (`timestamp` padrão `now()`).
- **[MODIFY]** Adicionar coluna `paidAt` (`timestamp` anulável, preenchido quando status for 'paga').

### 2. Tabela `clients`
Para sabermos quantas clientes novas foram cadastradas em uma determinada cobrança:
- **[MODIFY]** Adicionar coluna `registeredInCobrancaId` (`uuid` apontando para `cobrancas.id`). Quando o vendedor cadastrar um cliente durante a viagem, vinculamos a essa cobrança.

### 3. Tabela `payments`
Para os relatórios de "pagamentos recebidos na cobrança":
- **[MODIFY]** Adicionar coluna `cobrancaId` (`uuid` apontando para `cobrancas.id`). Mesmo que o vendedor receba um pagamento de uma ficha antiga de outra cobrança, o dinheiro "entrou" na cobrança atual.

### 4. Tabela `inventory_movements` (Histórico)
Para o relatório de movimentação detalhada de produtos:
- **[MODIFY]** Adicionar coluna `cobrancaId` (`uuid` anulável, apontando para `cobrancas.id`).
- **[MODIFY]** Expandir o enum `movement_type` para cobrir todos os cenários.
  - Atuais: `entrada_estoque`, `ajuste_manual`
  - Novos propostos: 
    - `transferencia_deposito_vendedor` (Sai do depósito principal, entra no vendedor)
    - `transferencia_vendedor_deposito` (Vendedor devolve ao depósito)
    - `nova_ficha_entrega` (Produtos deixados com o cliente, baixa no estoque do vendedor)
    - `ficha_acerto_devolucao` (Produtos que o cliente não vendeu retornam ao estoque do vendedor no momento do fechamento)
    - *(Nota: a venda real do produto não movimenta o estoque físico do vendedor novamente, pois já saiu em `nova_ficha_entrega`. Apenas gera financeiro)*.

### 5. Nova Tabela `cobranca_inventory_snapshots`
- **[NEW]** Criar tabela para armazenar o saldo inicial de produtos de um vendedor no momento em que a cobrança é iniciada.
- Colunas: `id`, `cobrancaId`, `productId`, `initialStock`, `createdAt`.

## Plano de Validação

### Testes Manuais
- Verificar se o comando `npm run generate` (ou similar do drizzle no server) roda sem erros de tipagem.
- Analisar o arquivo `.sql` de migration gerado para garantir que as constraints, chaves estrangeiras e default values estão de acordo com o Postgres.
