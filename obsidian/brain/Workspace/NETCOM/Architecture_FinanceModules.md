# 💳 Módulos Financeiros: Contas a Receber e Contas a Pagar

**Data de Atualização:** 18 de Maio de 2026  
**Caminhos Principais:**  
- `src/renderer/pages/Receivables/` (Contas a Receber)
- `src/renderer/pages/Payables/` (Contas a Pagar)

Este documento registra as decisões arquiteturais, regras de homogeneidade visual e comportamentos de UX de elite adotados para o controle financeiro do sistema.

---

## 🎨 1. Padrão de Homogeneidade Visual (Regra de Estilo)

Para manter a consistência absoluta da interface inspirada no macOS (conforme definido em `geral-rules.md`), ambas as telas compartilham rigorosamente da mesma estrutura visual e classes de estilo dinâmicas definidas localmente:

1. **Barra de Controles (`controlsBar`):**
   - Container com fundo sólido (`systemColors.background.primary`), cantos arredondados (`borderRadius: '10px'`), borda sutil e sombreamento refinado de acordo com o tema Dark/Light.
   - Rótulo de busca em caixa alta: `BUSCAR POR:`, cinza secundário, letra tamanho `12px` e `fontWeight: '600'`.
   - Botões de filtros avançados reutilizáveis com altura padrão de `32px` e ícones uniformizados (`AppIcons.User`, `AppIcons.Clipboard`, `AppIcons.Clock`).
   - Botão "Limpar Busca" vermelho translúcido de altura `32px` com `AppIcons.Close` (exibido condicionalmente).

2. **Abas macOS de Filtragem Rápida (`filterTabs`):**
   - Estrutura base de abas rápidas em formato de pílula integrada ao canto direito da barra de controles.
   - Rótulo ativo com **gradiente azul degradê premium do macOS**: `linear-gradient(to bottom, #5A9EDD, #3B7BC4)` e cor do texto em branco (`#FFFFFF`).
   - Transição suave de estados de aba por `all 0.15s ease`.

3. **Grelha e Linhas da Listagem (`gridHeader` & `gridRow`):**
   - Altura de linha padronizada com tamanho de fonte `12px`.
   - O cabeçalho da tabela (`gridHeader`) utiliza o fundo sólido `systemColors.background.primary` com bordas superior e inferior (`borderTop` e `borderBottom`), assegurando que a listagem seja encapsulada como um bloco premium contido.

---

## 🖱️ 2. UX Elite: Seleção Contígua por Arraste (Drag-to-Select)

Eliminou-se o uso de caixas de seleção (checkboxes) tradicionais na listagem de faturas, substituindo-as por um moderno sistema de arraste reativo inspirado em sistemas operacionais desktop:

- **Mecânica:** O usuário clica em uma fatura e, sem soltar o botão esquerdo do mouse (`onMouseDown`, `onMouseEnter`), desliza o cursor para cima ou para baixo para selecionar/desmarcar faturas de forma contígua e instantânea.
- **Validação Anti-Interferência:** Adiciona-se `e.stopPropagation()` em todos os botões de ação e modais individuais dentro da linha para impedir que interações individuais (ex: clicar no botão "Receber/Pagar") iniciem acidentalmente o gesto de arraste.
- **Feedback Estético:** A linha selecionada recebe uma borda de destaque azul lateral à esquerda de `4px` e um preenchimento suave translúcido.

---

## 🔒 3. Restrição de Lote por Único Cliente / Fornecedor

Para garantir a integridade fiscal e evitar que o usuário misture faturas de origens diferentes em um único lançamento financeiro em lote, implementou-se uma **trava de integridade de fluxo**:

- **Comportamento:** Ao iniciar a seleção de títulos de um cliente (ex: *João Silva*) ou fornecedor (ex: *CPFL Paulista*), todos os registros pertencentes a **outros** clientes/fornecedores na tabela ganham automaticamente:
  - Opacidade reduzida (`opacity: 0.35`).
  - Cursor de mouse do tipo inválido (`cursor: 'not-allowed'`).
  - Desativação completa de interações (`pointerEvents: 'none'`).
- **Resultado:** A interface comunica visualmente e de forma imediata o bloqueio, educando o usuário e prevenindo erros humanos antes que ocorram.

---

## ⏳ 4. Amortização Cronológica em Lote

Ao lançar uma liquidação em lote (Baixa Múltipla) informando um valor único, o sistema executa um algoritmo inteligente de amortização:

- **Algoritmo:** O valor recebido/pago é abatido priorizando sempre os vencimentos **mais antigos** para os **mais novos**.
- **Preview Dinâmico em Tempo Real:** Conforme o usuário digita o valor de quitação no input, o modal renderiza instantaneamente uma lista de simulação mostrando:
  - Faturas que serão **Totalmente Quitadas** (verde).
  - A fatura que será **Parcialmente Amortizada** com a exibição do novo saldo restante calculado.
  - Faturas que **Não serão afetadas** (cinza/opacas).
- O lançamento só persiste no banco de dados local após a confirmação final do usuário, mantendo logs transparentes de juros, multas e descontos no histórico do título.
