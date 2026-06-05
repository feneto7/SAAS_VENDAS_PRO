# 🏷️ Arquitetura de Etiquetas Customizadas (Labels)

Este documento registra as decisões arquiteturais, estrutura de componentes e integração do sistema de designer e impressão de etiquetas customizadas e de código de barras.

---

## 📂 Estrutura de Pastas e Componentes

A funcionalidade foi implementada de forma modular sob `src/renderer/pages/Labels/`:

- **`Labels.tsx`**: Contêiner mestre que organiza as abas nativas macOS minimalistas (Imprimir vs. Modelos) e gerencia o botão de retorno à tela de produtos.
- **`components/LabelDesigner.tsx`**: O Designer Visual Interativo (WYSIWYG) onde o usuário cria, edita e posiciona campos arrastando e soltando.
- **`components/LabelPrinter.tsx`**: A tela emissora de impressão contendo busca autocomplete de produtos do sistema, painel de sobrescrita e preview estático da etiqueta.
- **`src/main/handlers/printerHandler.ts`**: Canal nativo do main process Electron que gerencia a comunicação IPC com as impressoras do sistema operacional.

---

## 🎨 Layout e Dimensionamento WYSIWYG (Design Pixel-Scaling)

Para que o designer e o preview simulem perfeitamente o papel físico independente da resolução da tela ou do tema do sistema (Dark/Light):

### 1. Fator de Escala
Multiplicamos as dimensões em milímetros (mm) por um fator de escala dinâmico baseado na área útil de exibição em pixels:
```typescript
const scale = Math.min(maxCanvasWidth / widthMm, maxCanvasHeight / heightMm);
const widthInPx = widthMm * scale;
const heightInPx = heightMm * scale;
```

### 2. Representação do Papel e Contraste
Mesmo no modo Escuro (Dark Mode), o fundo do Canvas de design e do Preview de impressão são **forçados a branco (`#FFFFFF`) e o texto/barras a preto (`#000000`)**. O container ao redor do papel é estilizado com cor de contraste escuro ou cinza (`#CCCCCC`) para replicar visualmente a fita de papel saindo de uma impressora térmica de etiquetas.

### 3. Placeholder de Código de Barras
Para evitar gargalos de processamento redesenhando o código de barras a cada pixel movido no drag-and-drop, utilizamos um placeholder ultraleve em CSS com degradê repetido:
```css
background: repeating-linear-gradient(90deg, #000, #000 1.5px, transparent 1.5px, transparent 4px);
```

---

## 🖨️ Arquitetura de Impressão e Comunicação IPC

Para que a impressão ocorra sem diálogos ou modais de impressão adicionais bloqueando o usuário (Silent Printing):

### 1. Geração de Vetores SVG
Os códigos de barras são gerados como vetores puros SVG pelo front-end usando `jsbarcode`. Isso garante máxima nitidez de leitura no sensor infravermelho de leitores de código de barras, evitando o desfocamento comum em imagens rasterizadas (PNG/JPG).

### 2. Multi-Coluna e Chunking de Etiquetas
Quando o layout do modelo possui mais de uma coluna (etiquetas duplas ou triplas):
1. O array de cópias totais é segmentado de acordo com a quantidade de colunas.
2. Cada linha (row) HTML é gerada contendo as colunas reais e, se necessário, colunas transparentes (vazias) de preenchimento para preservar o alinhamento da última fileira.
3. Adiciona-se uma div espaçadora representando o `columnGap`.

### 3. Controle Físico do Papel
Para que a impressora térmica saiba exatamente quando parar de tracionar papel e evite ejectar etiquetas em branco desnecessariamente:
- O tamanho `@page` no CSS do HTML enviado para a impressão é dinâmico e corresponde exatamente à largura e altura da linha inteira gerada (soma das colunas + margens).
- Controlamos as quebras de página com `page-break-after: always;` e desabilitamos na última linha `.row:last-child { page-break-after: avoid; }`.

```html
<style>
  @page {
    size: ${totalWidth}mm ${totalHeight}mm;
    margin: 0;
  }
  body {
    margin: 0;
    padding: 0;
    width: ${totalWidth}mm;
    height: ${totalHeight}mm;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
  }
  .row {
    page-break-after: always;
    break-after: page;
  }
  .row:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }
</style>
```

---

## 💾 Persistência de Modelos

Os modelos de etiqueta são persistidos e lidos em formato JSON na chave `netcom_label_templates` do `localStorage` do navegador/renderer, permitindo edição contínua e recuperação rápida na tela de emissão.

---

## 🆕 Refatorações Recentes de Componentização e Notificação

1. **Uso de Notificações (`useToast`)**:
   - `LabelDesigner.tsx` e `LabelPrinter.tsx` foram totalmente integrados com o hook global `useToast()` do `ToastProvider` (`src/renderer/components/Toast/Toast.tsx`).
   - Todos os feedbacks temporários (ex: "Modelo salvo com sucesso!", "Modelo excluído com sucesso!", ou avisos de limitação de exclusão) agora utilizam os toasts dinâmicos do sistema, removendo popups bloqueantes de `alert()` do navegador.

2. **Componentização de Inputs e Formatação**:
   - **Campos de Valor (Money)**: O campo de sobrescrita de preço de venda (`overridePrice`) no `LabelPrinter.tsx` agora utiliza o componente modular **`CurrencyInput`**, aplicando a formatação correta de moeda.
   - **Campos de Quantidade (Quantity)**: O campo de número de cópias (`copies`) para impressão agora utiliza o componente modular **`QuantityInput`** com `unitType="1"`, eliminando decimais ou caracteres inválidos e garantindo consistência com `utils/quantityFormater.ts`.
