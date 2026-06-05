# 🚀 SAAS_VENDAS_PRO

> Sistema de gestão de vendas e acerto de fichas para vendedores externos (venda rápida/porta-a-porta).

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Backend** | Fastify + Drizzle ORM + PostgreSQL (Multi-tenant DB-per-tenant) |
| **Web** | Next.js + Tailwind CSS + Lucide Icons + Neumorphic Design System |
| **Mobile** | React Native (Expo) + SQLite (Local-First) + NativeWind v4 |

---

## 🗺️ Mapa do Projeto

### 🧰 [Skills](skills/) — Padrões técnicos obrigatórios
| Skill | Descrição |
|-------|-----------|
| [drizzle-orm-expert.md](skills/drizzle-orm-expert.md) | Padrões de uso do Drizzle ORM no backend |
| [react-native-architecture.md](skills/react-native-architecture.md) | Arquitetura e padrões do app mobile |

### 📄 [Docs](docs/) — Documentação do projeto
| Documento | Descrição |
|-----------|-----------|
| [overview.md](docs/overview.md) | Visão geral, features e arquitetura |
| [database_schema.md](docs/database_schema.md) | Schema completo do banco de dados (Master + Tenant) |
| [feature_workflows.md](docs/feature_workflows.md) | Fluxos de negócio (estoque, fichas, sync) |
| [decisions.md](docs/decisions.md) | Decisões técnicas e correções aprendidas |

### 🎨 [Style](style/) — Padrão visual
| Documento | Descrição |
|-----------|-----------|
| [ui_patterns.md](style/ui_patterns.md) | Design system neumórfico, classes CSS, tokens e padrões mobile |

---

## 🔑 Regras Específicas do Projeto

- **Offline-First**: Priorizar leitura do banco local (SQLite) para resposta instantânea.
- **Background Sync**: Sincronismo com API deve ser silencioso e não bloquear a UI.
- **UUIDs**: Entidades locais DEVEM usar UUIDs (`expo-crypto`) para compatibilidade com o servidor.
- **Valores Monetários**: Armazenados como INTEGER (centavos). Frontend usa `formatCentsToBRL`.
- **Local-First Sync Guard**: Proteção contra overwrite de dados "stale" do servidor.
- **Lock de Conferência**: Fichas com `items_locked = true` são bloqueadas. Desbloqueio somente via Dashboard Web pelo Admin.

---

## 🔗 Voltar

← [README Principal](../../README.md) | [GLOBAL_RULES](../../GLOBAL_RULES.md)
