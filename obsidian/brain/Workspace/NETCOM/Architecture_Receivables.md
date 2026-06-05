# Arquitetura do Módulo: Configurações de Recebimentos (Contas a Receber)

**Data de Atualização:** 17 de Maio de 2026
**Caminho Principal:** `src/renderer/pages/Settings/components/ReceivablesForm/`

Este módulo atua na interface gráfica do PDV para configurar globalmente as regras de recebimento a prazo (Contas a Receber) da empresa. 

## Estrutura de Arquivos
- `ReceivablesForm.tsx`: Formulário principal estilo MAC OS dividido em Painéis (Cards) de categorias de regras.
- `types.ts`: Define a tipagem estrita de multas (`LateFeeSettings`) e descontos (`EarlyDiscountSettings`).
- O módulo foi injetado na tab `receivables` do arquivo base `Settings.tsx`.

## Regras de Negócio e Decisões de Cálculo

A estrutura de dados para recebimentos segue o seguinte padrão para assegurar flexibilidade e cálculos precisos no ERP e PDV:

1. **Penalidades por Atraso (`lateFee`)**
   - **`gracePeriodDays` (Carência):** O sistema deve considerar os dias corridos de carência antes de adicionar um centavo à dívida do cliente. Se o pagamento ocorrer dentro do período de carência, as taxas abaixo devem ser **completamente ignoradas**.
   - **Multa (`fineType` & `fineValue`):** É cobrada de forma **única**, ou seja, somada apenas 1 vez ao título no momento que passa da carência, não importando se atrasou 1 mês ou 1 ano. Pode ser fixa (R$) ou percentual (%).
   - **Juros Pró-rata (`interestType` & `interestValue`):** A taxa de juros cresce conforme o tempo. Caso seja percentual ao mês (`monthly_percentage`), o backend/PDV deve dividir por 30 (pró-rata dia) e multiplicar pelos dias totais em atraso.

2. **Incentivos / Descontos (`earlyDiscount`)**
   - Regra aplicada de forma automática ao dar baixa em uma parcela na tela de Contas a Receber.
   - **`minDaysBeforeDue`**: Antecedência necessária para o abatimento ocorrer. 
   - Apenas ativado manualmente pela chave `enabled`.

## Refatoração Importante (Globalização de Componentes)
- O componente estilo macOS de Tooltips Informativos (antes restrito ao modal de pagamentos) foi extraído para `src/renderer/components/Tooltip/InfoTooltip.tsx`.
- Essa decisão de design garante homogeneidade (Regra Geral do Projeto) e reaproveitamento em qualquer nova tela complexa de configurações.
- A persistência dos valores monetários inseridos segue o utilitário `/utils/money.ts`, enviando *centavos* (números inteiros) como State final.
