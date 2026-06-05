# 📦 Arquitetura de Importação de XML (XmlEntries)

Este documento registra a arquitetura do formulário de importação de Notas Fiscais via XML (`XmlEntryForm.tsx`) e a correta integração de seus modais e tipos.

---

## 📂 Estrutura de Componentes

O fluxo de importação reside em `src/renderer/pages/Entries/components/forms/` e é composto pelo formulário principal e três modais auxiliares:

- **`XmlEntryForm.tsx`**: O formulário mestre de visualização e controle da nota importada.
- **`components/NewProductModal.tsx`**: Modal para cadastrar novos produtos identificados no XML que não existem no sistema.
- **`components/ConversionModal.tsx`**: Modal de conversão de unidades e definição dinâmica de margens de lucro/preços de venda.
- **`components/ProductSearchModal.tsx`**: Modal para pesquisa e associação com produtos já cadastrados na base local.

---

## 🎨 Integração com o Sistema de Temas (macOS / Minimalista)

Todos os componentes devem responder dinamicamente ao tema do sistema:

### ⚠️ Importação Correta do Contexto de Temas
**NUNCA** importe `ThemeContext` diretamente em componentes de tela. O contexto e os hooks devem ser importados de `ThemeProvider`:

```typescript
// ✅ CORRETO
import { useTheme } from '../../../../../styles/ThemeProvider';
```

### 🌓 Como Derivar o Estado Dark Mode e Estilos
Extraia `theme`, `systemColors` e `systemStyles` reativos do hook. Não use imports estáticos de `systemStyle` se precisar de reatividade real-time:

```typescript
const { theme, systemColors, systemStyles } = useTheme();
const isDark = theme === 'dark';

// Definição de bordas/fundos dinâmicos
const border = isDark ? 'rgba(255,255,255,0.10)' : systemColors.border.light;
const background = isDark ? '#1C1C1E' : '#FFFFFF';
```

---

## 🔊 Reprodução de Efeitos Sonoros (Click Sound)

Para manter a consistência e o feedback tátil da UI minimalista, utilize o hook `useClickSound` ao invés de imports de funções estáticas inexistentes:

```typescript
import { useClickSound } from '../../../../../hooks/useClickSound';

// Dentro do componente:
const playClickSound = useClickSound();

// Ao clicar:
playClickSound();
```

---

## 🗃️ Tipos Globais do Processo Electron (`electron.d.ts`)

Quando um arquivo de declaração de tipos (`.d.ts`) possui `export {}` no final (o que é obrigatório para estender interfaces globais como `Window`), as declarações feitas fora do bloco `declare global` **não são visíveis globalmente** para os arquivos do renderer.

### 🔑 Padrão Correto para Exposição Global de Interfaces
Todas as interfaces de dados de ponte (como `NFEProduct`, `NFEParseResult`, `CertificateInfo`) que precisam estar disponíveis para todo o front-end sem a necessidade de imports explícitos devem ser aninhadas dentro do bloco `declare global`:

```typescript
declare global {
  interface NFEProduct {
    itemNumber: string;
    code: string;
    ean: string;
    description: string;
    ncm: string;
    cfop: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }

  interface NFEParseResult {
    header: {
      tipo: string; numero: string; serie: string; chave: string;
      emitente: string; emitenteNome: string; emitenteCNPJ: string;
      destinatario: string; valor: number; pesoBruto: number;
      dataEmissao: string;
    };
    products: NFEProduct[];
  }
}
```

Isso impede conflitos de tipos, evita duplicidade de interfaces locais incompletas (ex: `NFEProduct` local nos modais) e simplifica o fluxo de dados em todo o front-end.

---

## 🚚 Arquitetura de Importação de CT-e (Conhecimento de Transporte Eletrônico)

O CT-e foca no lançamento e associação de despesas/valores de frete. Sua arquitetura compreende:

### 1. Extração do XML (Node/Main Process)
- O parser em `xmlImportHandler.ts` extrai a tag `<infCte>` contendo os dados do conhecimento de transporte (`nCT`, `serie`, `chCT`, `dhEmi`).
- O valor da prestação do serviço é mapeado sob `<vPrest>` e fatiado em componentes analíticos (`comp`), como "FRETE PESO", "SEC/CAT", "GRIS", "PEDAGIO", etc., sob a tag `<vTPrest>` (Valor Total do Serviço) e `<vRec>` (Valor a Receber).
- O relacionamento de notas transportadas é mapeado sob `<infDoc>` -> `<infNFe>`, coletando todas as chaves de acesso de NF-e vinculadas para fins de auditoria e integração de custos de transporte com estoque.

### 2. Fluxo da Janela Secundária (Renderer Process)
- A abertura da tela de Entrada de CT-e dispara `openEntryWindow('cte')`, criando uma janela nativa separada de 900x720.
- O componente `EntryWindowRouter.tsx` intercepta o parâmetro e renderiza o `<CteEntryForm />`.
- O formulário fornece Drag-and-Drop de arquivos e exibe as informações divididas em um layout de duas colunas (Split Screen): Dados Gerais e Rota no lado esquerdo; Detalhamento de Custos e NF-es vinculadas com facilidade de cópia rápida no lado direito.
- Utiliza um formatador local e robusto para evitar conversões e chamadas inválidas a métodos de string sobre números reais em tempo de execução.
