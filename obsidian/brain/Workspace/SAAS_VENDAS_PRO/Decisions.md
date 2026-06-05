# Decisions and Corrections - SAAS_VENDAS_PRO

## 🛠️ Recents Learnings & Fixes

### Inventory & Stock

- **Non-Negative Balance**: Validation implemented to ensure stock never drops below zero (warehouse and seller levels). DB constraints added.
- **Audit**: All movements are logged in `inventory_movements`.

### Financials

- **Currency Storage**: All values are stored as INTEGERS (cents). Frontend must use `formatCentsToBRL`.
- **Commission Logic**: Margin (default 30%) applies only to "CC" products.
- **Validation**: "Nova" status cards are limited to payments up to the value of "SC" items.
- **CardService (Shared Truth)**: Centralized logic in `mobilev2/src/services/cardService.ts` ensures that `total` and `status` are recalculated locally immediately after any item or payment change.
- **Golden Rule for PAGA**: A ficha only transitions to "PAGA" if: 1) Items are locked (`items_locked = 1`), 2) Balance is <= 0, and 3) ALL items have been explicitly conferred (`is_informed = 1`).

### Mobile & Synchronization

- **Sync Guard (Extended)**: Uses a 30-second `last_manual_update` window combined with `sync_queue` presence to prevent stale background fetches from overwriting local manual work.
- **Race Condition Prevention (Trava de Mão)**: Para estados definitivos que nascem no local-first (ex: travar uma ficha com `items_locked = 1`), é OBRIGATÓRIO preservar a trava local. Todo fetch do servidor que sobrescreve o banco local via `INSERT OR REPLACE` ou `UPDATE` precisa fazer uma leitura do banco local primeiro e aplicar `Math.max(local, server)` para evitar que dados atrasados do servidor (onde o PATCH da trava ainda não foi processado) desfaçam o bloqueio no App.
- **Local-First Rendering**: UI must decouple `loading` state from background sync. Data from SQLite must be displayed instantly; the network sync runs silently.
- **UUIDs**: Local entities MUST use UUIDs (`expo-crypto`) to match server schema.
- **SyncService**: Centralized utility for enqueuing API actions (`enqueue`).

### Backend (Fastify)

- **Physical Isolation**: Database-per-tenant architecture. Route isolation via `x-tenant-slug` header.
- **Type Safety**: Use explicit casts for dynamic request bodies (`as any`) to avoid TS errors.
