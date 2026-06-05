# 🃏 TCG_PROJECT

> Trading Card Game online focado em experiência web mobile (landscape), com design premium e modularização total.

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Vite + React + TypeScript |
| **Estilos** | CSS Custom Properties + `theme.ts` (tokens centralizados) |
| **Assets** | SVGs elementais em `/assets/elements/` |

---

## 🗺️ Mapa do Projeto

### 🧰 [Skills](skills/) — Padrões técnicos obrigatórios
> Nenhuma skill específica definida ainda. Adicionar conforme o projeto evoluir.

### 📄 [Docs](docs/) — Documentação do projeto
| Documento | Descrição |
|-----------|-----------|
| [overview.md](docs/overview.md) | Visão geral, regras de jogo, fases concluídas e estrutura de pastas |

### 🎨 [Style](style/) — Padrão visual
| Documento | Descrição |
|-----------|-----------|
| [card_system_design.md](style/card_system_design.md) | Decision Log do design das cartas, layout e assumptions |

---

## 🔑 Regras Específicas do Projeto

- **Foco Mobile Landscape**: Layout horizontal obrigatório.
- **Atomic Design**: atoms → molecules → organisms → templates.
- **Zero Hardcode**: Todas as cores vêm de `theme.ts` via CSS Custom Properties.
- **Elementos**: 8 elementos (Fogo, Água, Vento, Terra, Gelo, Light, Dark, Normal) com paleta definida.
- **Raridades**: Common, Rare, Super Rare, Epic, Legend — cada uma com glow progressivo via `box-shadow`.

---

## 🔗 Voltar

← [README Principal](../../README.md) | [GLOBAL_RULES](../../GLOBAL_RULES.md)
