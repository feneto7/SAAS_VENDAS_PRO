# 🃏 TCG Card System — Design Document

> Criado em: 2026-05-03 | Status: Aprovado para Implementação

## Decision Log

| # | Decisão | Alternativas | Motivo da Escolha |
|---|---------|-------------|-------------------|
| 1 | Moldura **Orgânica** (detalhes naturais por elemento) | Geométrica, Híbrida | Visual fantasy/épico alinhado ao TCG |
| 2 | **Mesma estrutura** para todos os tipos de carta | Formas distintas, Distinção sutil | Simplicidade + consistência visual |
| 3 | Raridade por **Glow progressivo** | Textura, Combinação em camadas | Elegante, performático, fácil de escalar |
| 4 | Não-Criaturas: **mana no rodapé, sem ATK/DEF** | Sem rodapé, Expande caixa de efeito | Consistência de layout |
| 5 | Cor do elemento na **borda/frame completo** | Gradiente interno, Ambos | Impacto visual máximo |
| 6 | **Card do zero + DeckEditor ajustado** | Tudo do zero, Apenas frames | Respeita o que foi validado previamente |
| 7 | **Abordagem 1**: CSS Custom Properties + `data-element`/`data-rarity` | Componentes por raridade, Inline styles | YAGNI, zero hardcode, permite pseudo-elementos |

## Layout da Carta (Aprovado)

```
┌──────────────────────────────┐
│ [Nome da Carta]   [🔥 Ícone] │  ← CardHeader
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│      [IMAGEM DA CARTA]       │  ← CardImageArea
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  [Arquétipo / Tipo]          │  ← CardTypeBar
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  [Habilidade / Efeito]       │  ← CardEffectBox
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ [💎 Mana]    [ATK X / DEF Y] │  ← CardFooter (Criatura)
│ [💎 Mana]                    │  ← CardFooter (outros)
└──────────────────────────────┘
```

## Assumptions Documentadas

- Proporção da carta: ~2:3 (padrão TCG)
- Componente `Card` usa props para raridade/elemento — sem subcomponentes por raridade
- Ícones dos elementos: imagens SVG em `/assets/elements/`
- Cores: ZERO hardcode — todas em `theme.ts`
- Glow: via `box-shadow` CSS com variável `--card-glow`
- Animação legend: CSS `@keyframes pulse-glow`
- Projeto: Vite + React + TypeScript

## Non-Goals

- Lógica de gameplay
- Back-end de cartas
- Outros elementos além dos 8 definidos
