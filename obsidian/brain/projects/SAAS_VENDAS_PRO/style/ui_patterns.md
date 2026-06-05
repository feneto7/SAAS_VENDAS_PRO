# 🎨 UI Patterns — Web & Mobile (Standard Elite)

## 🌑 Neumorphic Design System (Web — PADRÃO DEFINITIVO)

### Pasta Central de Estilos
- **Localização**: `web/src/styles/` — ÚNICA fonte de verdade para estilos neumórficos.
- **Entry Point**: `import '@/styles/index.css'` já importado em `globals.css`.
- **ThemeProvider**: `NmThemeProvider` em `layout.tsx` gerencia `data-theme` no `<html>`.
- **Hook de tema**: `useTheme()` de `@/styles/ThemeProvider`.
- **Toggle de tema**: Componente `<ThemeToggle />` de `@/styles/ThemeToggle`.

### Classes Neumórficas (.nm-*)
Todas as classes seguem o prefixo `nm-`:

| Família         | Classes principais |
|-----------------|-------------------|
| Botões          | `.nm-btn`, `.nm-btn--accent`, `.nm-btn--glow`, `.nm-btn--inset`, `.nm-btn--circle` |
| Cards           | `.nm-card`, `.nm-card--inset`, `.nm-card--glow`, `.nm-stat-card` |
| Inputs          | `.nm-input`, `.nm-input--error`, `.nm-select`, `.nm-textarea` |
| Badges          | `.nm-badge`, `.nm-badge--accent/success/danger`, `.nm-pill`, `.nm-counter` |
| Toggles         | `.nm-switch`, `.nm-knob`, `.nm-toggle-group` |
| Sliders         | `.nm-slider`, `.nm-progress`, `.nm-slider--accent` |
| Tabelas         | `.nm-table-wrapper`, `.nm-table`, `nm-row--selected` |
| Modais          | `.nm-modal-backdrop`, `.nm-modal`, `.nm-modal--glow` |
| Sidebar/Nav     | `.nm-sidebar`, `.nm-nav-item`, `.nm-nav-item--active` |
| Avatares        | `.nm-avatar`, `.nm-icon-circle`, `.nm-icon-circle--glow--double` |

### Tokens CSS
- **Dark theme**: `[data-theme="dark"]` — bg `#1e2028`, accent cyan `#00e5c8`
- **Light theme**: `[data-theme="light"]` — bg `#e8ecf0`, accent roxo `#6c5ce7`
- **NUNCA hardcode** sombras ou cores fora das CSS Variables `--nm-*`.
- **Showcase**: Acesse `/design-system` para ver todos os componentes ao vivo.

### Double-Shot Lighting
- `--nm-shadow-raised`: convexo (elemento saindo da superfície)
- `--nm-shadow-inset`: côncavo (elemento afundado)
- `--nm-shadow-glow`: raised + halo accent luminoso
- `--nm-shadow-flat`: sutil, para hover states

---

## 📱 Mobile UI Patterns

- **Glow Effects**: `glowTop` e `glowBottom` para profundidade.
- **Glassmorphism**: Fundos semi-transparentes com bordas sutis.
- **Lucide Icons**: Substituição total de emojis/ícones básicos por Lucide.
- **Colors**: NUNCA hardcoded — importar de `theme.ts`.
- **Themed Components**: `DefaultView` e `DefaultText` para temas nativos.

## ⚡ Performance & Feedback

- **Zero-Latency Item Addition**: UI exibe itens imediatamente após inserção SQLite.
- **Header Live-Stats**: `useMemo` para derivar totais — evita "jumps" de valor.
- **Skeleton Loaders**: Carregamento local instantâneo, loader silencioso para sync.
- **Modais**: Padronizados com `ModalHeader` e animações suaves.
