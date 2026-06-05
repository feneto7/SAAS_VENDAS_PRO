# 🃏 TCG Online Project: Overview

## 📝 Descrição
Um Trading Card Game (TCG) online focado em experiência web mobile (horizontal), com foco em modularização e design premium.

## 📐 Regras de Design
- **Foco**: Mobile Landscape (Horizontal).
- **Arquitetura**: 100% Modular e Componentizada (Atomic Design: atoms → molecules → organisms → templates).
- **Estrutura**: `/assets`, `/server`, `/client`.
- **Zero Hardcode**: Todas as cores vêm de `theme.ts` via CSS Custom Properties.
- **Stack**: Vite + React + TypeScript.

## 🃏 Sistema de Jogo
### Elementos e Cores
- **Fogo**: Vermelho — `border: #c0392b`
- **Água**: Azul — `border: #1a6fa8`
- **Vento**: Verde — `border: #1e8449`
- **Terra**: Marrom — `border: #7d6608`
- **Gelo**: Azul Gelo — `border: #1a5276`
- **Light**: Dourado — `border: #b7950b`
- **Dark**: Roxo/Preto — `border: #4a235a`
- **Normal**: Cinza — `border: #626567`

### Raridades
- Common (sem glow), Rare (glow sutil), Super Rare (glow médio), Epic (glow forte), Legend (pulsante animado).

### Tipos de Carta
- Criatura (com ATK/DEF), Campo, Equipamento, Feitiço, Magia (sem ATK/DEF, mantém Mana no rodapé).

### Atributos
- **Custo de Mana**: 1 a 10.
- **ATK / DEF**: 0 a 10+ (base). Somente Criaturas.

## 🚀 Fases Concluídas
- [x] Estruturação modular (`assets`, `client`, `server`).
- [x] Geração de ícones elementais SVG (Fire, Water, Wind, Earth, Ice, Light, Dark, Normal).
- [x] Sistema de tipos TypeScript completo (`types/index.ts`).
- [x] Sistema de tokens de design (`styles/theme.ts`) — ELEMENT_PALETTE + RARITY_GLOW.
- [x] CSS global com Google Fonts (Cinzel, Crimson Text, Exo 2) e variáveis base.
- [x] Atoms: ElementIcon, ManaCost, StatBadge, RarityBadge.
- [x] Molecules: CardHeader, CardImageArea, CardTypeBar, CardEffectBox, CardFooter.
- [x] Organism: Card (moldura orgânica por elemento via CSS Custom Properties + data-attrs).
- [x] Template: DeckEditor (3 colunas landscape, filtros, preview, gestão de deck).
- [x] Mock data: 8 cartas (1 por elemento), mix de tipos e raridades.

## 🛠️ Componentes Principais
- `Card`: Organismo central com moldura orgânica por elemento + glow progressivo por raridade.
- `DeckEditor`: Template 3 colunas (Deck | Preview | Coleção+Filtros).
- `theme.ts`: `ELEMENT_PALETTE`, `RARITY_GLOW`, `buildCardCssVars()`, `buildCardGlowShadow()`.

## 📁 Estrutura de Pastas
```
/assets/elements/   ← SVGs dos 8 elementos
/client/src/
  types/index.ts
  styles/theme.ts
  constants/mockCards.ts
  components/
    atoms/          ElementIcon, ManaCost, StatBadge, RarityBadge
    molecules/      CardHeader, CardImageArea, CardTypeBar, CardEffectBox, CardFooter
    organisms/      Card
    templates/      DeckEditor
```

## 🎯 Decisões de Design do Card System
Ver `CardSystem_Design.md` para Decision Log completo.
- Moldura: Orgânica (detalhes naturais por elemento via ::after + CSS gradients).
- Estrutura: Mesma moldura para todos os tipos (diferença é interna).
- Raridade: Glow progressivo por box-shadow.
- Cor do elemento: Frame completo (border-color + detalhes via ::after).


## 📝 Descrição
Um Trading Card Game (TCG) online focado em experiência web mobile (horizontal), com foco em modularização e design premium.

## 📐 Regras de Design
- **Foco**: Mobile Landscape (Horizontal).
- **Arquitetura**: 100% Modular e Componentizada.
- **Estrutura**: `/assets`, `/server`, `/client`.

## 🃏 Sistema de Jogo
### Elementos e Cores
- **Fogo**: Vermelho
- **Água**: Azul
- **Vento**: Verde
- **Terra**: Marrom
- **Gelo**: Azul Gelo
- **Light**: Dourado
- **Dark**: Preto
- **Normal**: Cinza

### Raridades
- Common, Rare, Super Rare, Epic, Legend. (Cada uma com componente visual distinto).

### Tipos de Carta
- Criatura, Campo, Equipamento, Feitiço, Magia.

### Atributos
- **Custo de Mana**: 1 a 10.
- **ATK / DEF**: 0 a 10+ (base).

## 🚀 Fase Atual: Concluída
- [x] Estruturação modular (`assets`, `client`, `server`).
- [x] Geração de ícones elementais (Fire, Water, Wind, Earth, Ice, Light, Dark, Normal).
- [x] Implementação do Deck Editor (React/TS) com layout Landscape (Foco exclusivo em Main Deck).
- [x] Sistema de raridades com estilos visuais premium (glassmorphism/glow).

## 🛠️ Principais Componentes
- `Card`: Organismo central com suporte a 5 raridades e 8 elementos.
- `DeckEditor`: Template principal de 3 colunas para mobile horizontal.
- `theme`: Sistema de tokens centralizado para cores e spacing.

