# Arquitetura do Módulo: Formas de Pagamento (PDV Enterprise)

**Data de Atualização:** 17 de Maio de 2026
**Caminho Principal:** `src/renderer/pages/Settings/components/PaymentsForm/`

O módulo de Formas de Pagamento foi refatorado e elevado a um padrão **Enterprise**, com foco na segurança financeira, integração com TEF, e fluxo de caixa de retaguarda. Todo o desenvolvimento seguiu estritamente as regras de estilo MAC OS do projeto e modularização extrema.

## Estrutura de Arquivos
- `PaymentsForm.tsx`: O componente de listagem no formato Grid. Exibe cartões interativos para cada forma de pagamento com _badges_ visuais indicando propriedades ativas (Ex: `TEF`, `% Juros`).
- `components/PaymentMethodModal.tsx`: Componente de interface principal responsável pela adição e edição. Utiliza um design de **Abas (Tabs)** com altura absolutamente fixa (`height: 380px`) para impedir saltos visuais durante a navegação.
- `types.ts`: Arquivo que isola completamente o contrato de dados (`PaymentMethod`) e concentra os `mockPaymentMethods`.

## Contrato de Dados (`PaymentMethod`)
A interface foi expandida em "sub-módulos" de configuração:

1. **Campos Base (`type`, `termType`)**:
   - Classificação principal (Dinheiro, Cartão de Crédito, Pix, etc.).
   - Classificação de Prazo (`cash` vs `installments`).

2. **Juros e Prazos (`interest`)**:
   - Suporta Juros Fixos (R$) ou Percentuais (%).
   - Pode ser aplicado no montante Total ou em Cada Parcela separadamente.

3. **Integração TEF (`tef`)**:
   - Guarda o provedor da maquininha (Stone, Sitef, MercadoPago).
   - Flag de `autoConfirm` para transição rápida de tela no PDV.

4. **Retaguarda e Fluxo de Caixa (`backoffice`)**:
   - `mdrFee`: Taxa cobrada pela adquirente.
   - `settlementDays`: Prazo de liquidação/compensação (D+0, D+1, etc.).
   - `deductMdrFromCommission`: Define se o PDV abate a taxa da máquina na hora de calcular comissão do vendedor.
   - *(Decisão de Design)*: O campo `bankAccountId` foi explicitamente descartado para manter a UI mais leve.

5. **Regras do PDV (`posRules`)**:
   - `requireCustomer`: Trava a frente de caixa obrigando a inserção de CPF/CNPJ.
   - `requireManagerPassword`: Trava a frente de caixa exigindo liberação por credencial de supervisor (útil para pagamentos do tipo Promissória/Carnê).
   - *(Decisão de Design)*: O campo `hotkey` (Tecla de atalho) foi removido da configuração individual. O sistema mapeará atalhos globalmente via hardcode na lógica de frente de caixa.

## Decisões Técnicas e Padrões Implementados

1. **Transações em Centavos:** Todo o fluxo financeiro do modal (como `minInstallmentValue` ou juros fixos) utiliza estritamente o `convertReaisToCents` antes de salvar e `convertCentsToReais` ao carregar a interface. O BD só recebe centavos.
2. **Prevenção de Pulo de Tela:** O `PaymentMethodModal` possui um content frame com `height: '380px'`. Qualquer variação no tamanho do formulário entre as abas não altera o tamanho do modal.
3. **Tooltips Premium (Estilo MAC):** Inserimos pequenos ícones `(i)` ao lado das labels complexas usando o componente customizado `InfoTooltip`. Ele exibe explicações num pop-up de alto contraste e bordas arredondadas sem uso de bibliotecas externas pesadas, usando apenas o `AppIcons.Info`.

## Próximos Passos Restantes
- Integrar a leitura completa deste objeto `PaymentMethod` na página de PDV (`Sales.tsx`). Quando o operador de caixa disparar a cobrança, o componente finalizador deve consumir e respeitar o `tef.enabled`, acréscimos do `interest` e as travas do `posRules`.
