# 🎨 Mobile UI Patterns (Standard Elite)

## Layout & Components

- **Glow Effects**: Uso de `glowTop` e `glowBottom` para profundidade.
- **Glassmorphism**: Fundos semi-transparentes (`rgba`) com bordas sutis.
- **Lucide Icons**: Substituição total de emojis e ícones básicos por Lucide.

## Theme System

- **Colors**: NUNCA usar cores hardcoded. Importar de `theme.ts`.
- **Themed Components**: Envolver componentes em `DefaultView` e `DefaultText` para suporte nativo a temas.

## Feedback & UX

- **Skeleton Loaders**: Carregamento local instantâneo, loader silencioso para background sync.
- **Modais**: Padronização com `ModalHeader` customizado e animações suaves.
