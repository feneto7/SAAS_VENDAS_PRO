# 🧾 Arquitetura de Perfis Tributários (Tax Profiles) & Matriz de Decisão

Este documento registra a especificação técnica do motor fiscal reativo e matriz multidimensional para cálculo dinâmico de impostos.

---

## 📂 Fluxo e Resolução de Regras

A resolução de regras fiscais ocorre através de um motor de pontuação (Scoring System) implementado em `src/renderer/utils/taxProfileService.ts`:

```
[Cadastro do Produto] (Digita NCM)
         ↓
[taxProfileService.ts] (Busca Perfil por NCM)
         ↓
[calculateTaxes] (Avalia Contexto do Simulador)
         ↓
    Filtro de Regras
    Cálculo de Pontuação (Score System)
    Ordenação e Seleção (Maior Pontuação)
         ↓
[Resultado Fiscais Resolvidos] (CFOP, CST, ICMS%, ST%, PIS/COFINS, IPI)
```

---

## ⚡ Algoritmo de Pontuação de Regras (Scoring Matrix)

Para resolver conflitos e priorizar regras específicas sobre regras genéricas (curingas), as regras candidatas da matriz de decisão de um perfil acumulam pontos com base nos seguintes pesos:

### 1. Critério Geográfico (UF de Destino)
- **UF de Destino Exata** (`applyWhen === 'specific'` e `rule.targetUf === context.targetUf`): **+100 pontos** (Prioridade Máxima).
- **Match Geográfico Categoria** (`applyWhen === 'state'` e coincide com a UF da empresa logada, ou `applyWhen === 'interstate'` e é diferente da UF da empresa logada): **+50 pontos**.
- **Curinga Geográfico** (`applyWhen === 'any'` para qualquer destino): **+10 pontos**.
- **Mismatch:** Se a UF de destino não bater com nenhum dos critérios da regra, a regra é descartada da lista de candidatas.

### 2. Tipo de Operação / Finalidade
- **Operação Exata** (Ex: Operação de Venda e Regra para "venda"): **+100 pontos**.
- **Curinga de Operação** (Regra definida para "TODOS"): **+10 pontos**.
- **Mismatch:** Regra é descartada.

---

## 🎨 UI & Simulador Contextual

- **Tela de Parâmetros (`ParametrosTab.tsx` / `TaxProfilesSubTab.tsx`):**
  - Todas as abas individuais antigas (ICMS, PIS, COFINS, IPI) foram removidas para evitar redundância de código e manter a interface focada na matriz tributária.
  - A tela de Parâmetros agora renderiza diretamente a tabela de perfis e a matriz de decisão (`TaxProfilesSubTab.tsx`).
  - Permite configurar o enquadramento do perfil (NCM, CEST, Origem).
  - Permite configurar a matriz de regras associada, separando a condicional geográfica em dois campos:
    1. **Aplicar Quando**: define a lógica da condição (`any` | `state` | `interstate` | `specific`).
    2. **UF Destino**: define o estado físico da condicional (exibido apenas se "UF específica" for selecionado).
  - A UF de origem e o regime tributário da empresa logada são obtidos automaticamente.

- **Simulador do Modal (`TaxTab.tsx`):**
  - Disponibiliza uma barra de contexto reativo contendo seletores de UF de Destino e Operação.
  - O componente invoca `calculateTaxes` dinamicamente a cada alteração do contexto e renderiza os impostos e o nome da regra aplicada em tempo real.
  - Ao salvar o produto no modal, as regras resolvidas são consolidadas no payload final.
