# 🎨 Mobile UI Patterns (Standard Elite)

## Layout & Components

- **Glow Effects**: Uso de `glowTop` e `glowBottom` para profundidade.
- **Glassmorphism**: Fundos semi-transparentes (`rgba`) com bordas sutis.
- **Lucide Icons**: Substituição total de emojis e ícones básicos por Lucide.

## Theme System

- **Colors**: NUNCA usar cores hardcoded. Importar de `theme.ts`.
- **Themed Components**: Envolver componentes em `DefaultView` e `DefaultText` para suporte nativo a temas.

## ⚡ Performance & Feedback

- **Zero-Latency Item Addition**: UI must display new items immediately after SQLite insertion. Use `loading = false` as soon as the local query returns, letting `SyncService` handle server persistence in the background.
- **Header Live-Stats**: Use `useMemo` in hooks to derive totals from the current `items` and `payments` states. This avoids "jumps" in values when the server response arrives after local manual updates.

## Feedback & UX

- **Skeleton Loaders**: Carregamento local instantâneo, loader silencioso para background sync.
- **Modais**: Padronização com `ModalHeader` customizado e animações suaves.
