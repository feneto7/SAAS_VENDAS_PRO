# 🔄 Feature Workflows & Business Logic

## 📦 Gestão de Estoque

- **Dualidade**: Depósito (Global) vs Vendedor (Carga).
- **Venda**: Dedução virtual em memória durante a seleção do produto, persistência no SQLite ao finalizar.

## 🃏 Acerto de Fichas (Settlement)

1. **Ativos**: Itens CC (Com Comissão) e Itens SC (Sem Comissão).
2. **Cálculo**: `Total = (Itens CC - Comissão%) + Itens SC`.
3. **Status Flow**: `nova` -> `pendente` (Active Conference) -> `paga` (Settled).
4. **Fechamento de Produtos**: Ao clicar em "Fechar Ficha", o sistema trava a edição de quantidades (`items_locked = 1`) e bloqueia a adição de novos itens.
5. **Conferência Obrigatória**: Para virar `paga`, cada item deve ser aberto e o valor vendido/devolvido confirmado (marcado como `is_informed = 1`).
6. **Auto-Paga**: O sistema verifica saldo e conferência em tempo real. Se `Saldo <= 0` e `Informed = ALL`, o status muda para `paga` e o financeiro é bloqueado.

## 🛡️ Sync Engine

- **FIFO**: Ações enfileiradas na `sync_queue` são processadas na ordem de criação.
- **Sync Guard**: Proteção contra overwrite de dados "stale" do servidor se existir lógia local pendente.

## 🔡 Localização (PT-BR)

- **Status Display**: Uso mandatório de `formatStatus` para exibir status amigáveis ao usuário final.
