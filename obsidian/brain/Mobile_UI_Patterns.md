# Padrões de UI Mobile (Elite Style)

Este documento registra os padrões de design de alta performance e estética premium adotados nos aplicativos mobile do projeto.

## 1. Modais Reais (Premium Modal)

Os modais devem seguir a estrutura de "Slide-up" (deslizar de baixo para cima) ocupando a maior parte da tela.

### Estrutura Base

- **Overlay**: `rgba(0,0,0,0.6)` para foco total no modal.
- **Bordas**: `borderTopLeftRadius: 28` e `borderTopRightRadius: 28`.
- **Altura**: `92%` (para dar a sensação de que o modal está "sobre" a tela anterior, mas sem cobri-la totalmente no topo).
- **Sombra**: Usar `Shadows.black` para profundidade.

### Layout Interno

- **Header**: Fixo, com título (`fontSize: 22`, `fontWeight: 800`) e botão de fechar circular estilizado.
- **ScrollView**: Com `contentContainerStyle={{ padding: 24 }}` para respiro visual.
- **Footer**: Fixo na base, com fundo `Colors.cardBg` e borda superior sutil. Botões em linha (`flexDirection: row`).

## 2. Formulários Organizados (Sectioning)

Evitar listas intermináveis de campos. Agrupar por contexto:

- **SectionHeader**: `flexDirection: row`, `borderLeftWidth: 3`, `borderLeftColor: Colors.primary`.
- **Título da Seção**: `fontSize: 12`, `fontWeight: 800`, `textTransform: uppercase`, `letterSpacing: 1`.

## 3. Componente Input (Dark Modern)

O input não deve ser apenas um "box branco". Para o tema Dark:

- **Background**: `Colors.cardBg` (translúcido/sutil).
- **Border**: `1.5px` com `Colors.cardBorder`.
- **Label**: Sempre acima do campo, `fontSize: 13`, `fontWeight: 700`, `color: Colors.textSecondary`, `textTransform: uppercase`.
- **Ícones**: Suporte nativo a ícones **Lucide** à esquerda do texto para facilitar o reconhecimento visual.
- **Espaçamento**: `marginBottom: 20` entre campos para evitar poluição visual.

## 5. Glassmorphism & Summary Cards

Para resumos financeiros e dashboards mobile, usamos o estilo "Glass":

- **Card Transparente**: `backgroundColor: Colors.cardBg + 'F0'` (leve transparência).
- **Borda Colorida Ativa**: `borderLeftWidth: 4` com cores semânticas (`Colors.primary`, `Colors.success`, `Colors.warning`).
- **Icon Box**: Ícone centralizado em um box com `backgroundColor: color + '15'` (15% de opacidade da cor principal do card).
- **Hierarquia de Texto**: Valor principal em destaque (`fontWeight: 900`, `fontSize: 20`) e legendas em `Colors.textSecondary`.

## 6. Referência de Estrutura: Modal AddCustomer

O modal de `AddCustomer` é o nosso "padrão ouro" para formulários complexos:

1. **Header**: Título e subtítulo claros, com botão de fechar sutil à direita.
2. **Campos**: Organizados por seções lógicas (Identificação, Endereço, Contato).
3. **Máscaras**: CPF e Celular com máscaras nativas de tempo real.
4. **Footer**: Botão de ação principal sempre fixo, com `Shadows` para destacar sobre o conteúdo que corre em baixo.

---

_Este padrão deve ser seguido rigorosamente para garantir consistência visual em todo o ecossistema Vendas Pro._
