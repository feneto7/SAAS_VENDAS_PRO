# Decisions and Corrections - SAAS_VENDAS_PRO

## 🛠️ Recents Learnings & Fixes

### Inventory & Stock

- **Non-Negative Balance**: Validation implemented to ensure stock never drops below zero (warehouse and seller levels). DB constraints added.
- **Audit**: All movements are logged in `inventory_movements`.

### Financials

- **Currency Storage**: All values are stored as INTEGERS (cents). Frontend must use `formatCentsToBRL`.
- **Commission Logic**: Margin (default 30%) applies only to "CC" products.
- **Validation**: "Nova" status cards are limited to payments up to the value of "SC" items.

### Mobile & Synchronization

- **Sync Guard**: Implemented check on `sync_queue` to prevent background sync from overwriting local changes still pending upload.
- **UUIDs**: Local entities MUST use UUIDs (`expo-crypto`) to match server schema.
- **Hierarchical Navigation**: Prioritize `router.back()` with stateful fallbacks to maintain context.

### Backend (Fastify)

- **Physical Isolation**: Database-per-tenant architecture. Route isolation via `x-tenant-slug` header.
- **Type Safety**: Use explicit casts for dynamic request bodies (`as any`) to avoid TS errors.
