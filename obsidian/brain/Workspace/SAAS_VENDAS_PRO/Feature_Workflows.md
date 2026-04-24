# 🔄 Feature Workflows & Business Logic

## 📦 Gestão de Estoque

- **Dualidade**: Depósito (Global) vs Vendedor (Carga).
- **Venda**: Dedução virtual em memória durante a seleção do produto, persistência no SQLite ao finalizar.

## 🃏 Acerto de Fichas (Settlement)

1. **Ativos**: Itens CC (Com Comissão) e Itens SC (Sem Comissão).
2. **Cálculo**: `Total = (Itens CC - Comissão%) + Itens SC`.
3. **Status Flow**: `nova` -> `pendente` -> `paga`.

## 🛡️ Sync Engine

- **FIFO**: Ações enfileiradas na `sync_queue` são processadas na ordem de criação.
- **Sync Guard**: Proteção contra overwrite de dados "stale" do servidor se existir lógia local pendente.

## 🔡 Localização (PT-BR)

- **Status Display**: Uso mandatório de `formatStatus` para exibir status amigáveis ao usuário final.
