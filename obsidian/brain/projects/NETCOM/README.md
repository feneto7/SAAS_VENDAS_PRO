# 🖥️ NETCOM

> ERP Desktop completo para gestão empresarial (vendas, estoque, financeiro, fiscal, OS).

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Desktop** | Electron + Vite + React + TypeScript |
| **Banco Local** | SQLite (via IPC seguro) |
| **Backend** | Laravel (API externa — NÃO modificar, responsabilidade de outro dev) |
| **Estilos** | `styles/systemStyle.ts` + `styles/reset.css` (Design MAC-like) |

---

## 🗺️ Mapa do Projeto

### 🧰 [Skills](skills/) — Padrões técnicos obrigatórios
| Skill | Descrição |
|-------|-----------|
| [electron-development.md](skills/electron-development.md) | IPC seguro, ciclo de vida, isolamento de contexto |
| [typescript-expert.md](skills/typescript-expert.md) | Tipagem avançada, prevenção de erros, interfaces seguras |

### 📄 [Docs](docs/) — Documentação de arquitetura
| Documento | Descrição |
|-----------|-----------|
| [architecture_cash_drawer.md](docs/architecture_cash_drawer.md) | Módulo de caixa |
| [architecture_clients.md](docs/architecture_clients.md) | Módulo de clientes |
| [architecture_email.md](docs/architecture_email.md) | Módulo de e-mail |
| [architecture_finance_modules.md](docs/architecture_finance_modules.md) | Módulos financeiros |
| [architecture_labels.md](docs/architecture_labels.md) | Módulo de etiquetas |
| [architecture_payments.md](docs/architecture_payments.md) | Módulo de pagamentos |
| [architecture_receivables.md](docs/architecture_receivables.md) | Módulo de contas a receber |
| [architecture_tax_profiles.md](docs/architecture_tax_profiles.md) | Perfis fiscais |
| [architecture_transporters.md](docs/architecture_transporters.md) | Módulo de transportadoras |
| [architecture_users.md](docs/architecture_users.md) | Módulo de usuários |
| [architecture_xml_entries.md](docs/architecture_xml_entries.md) | Módulo de entradas XML |

### 🎨 [Style](style/) — Padrão visual
| Documento | Descrição |
|-----------|-----------|
| [ui_rules.md](style/ui_rules.md) | Regras de estilo MAC-like, formulários premium, abas e padrões visuais |

---

## 🔑 Regras Específicas do Projeto

- **NUNCA modificar o backend (Laravel)** — documentar alterações necessárias para repassar ao dev responsável.
- **Estilos via `systemStyle.ts`**: Inspiração MAC, formulários premium, glassmorphism.
- **`ActionButton`**: Todas as colunas de "Ações" em listagens devem usar o componente `<ActionButton />`.
- **`AddButton`**: Botões de "adicionar" ao lado de selects devem usar `<AddButton />`.
- **`useClickSound`**: Todos os botões e elementos interativos devem emitir som de clique.
- **`useToast`**: Feedback visual de ações via hook global de toasts.
- **`WindowHeader`**: Modais devem usar o componente base com tokens de `systemStyles.modal`.
- **Janelas Externas**: Seguir padrão de IPC handler + preload bridge + detecção `?window=xxx` + contêiner com background dinâmico.
- **Offline-First (SQLite)**: Leitura prioritária do banco local. Fallback para API apenas se local retornar nulo.
- **Hooks de DB**: Acesso ao SQLite via `useLocalDb.ts`, nunca instanciar diretamente nos componentes.

---

## 🔗 Voltar

← [README Principal](../../README.md) | [GLOBAL_RULES](../../GLOBAL_RULES.md)
