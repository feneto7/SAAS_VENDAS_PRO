# 🎨 UI Rules — NETCOM (Design MAC-like)

> Padrão visual obrigatório do projeto NETCOM. Inspiração: sistema operacional macOS — minimalista, premium, glassmorphism.

---

## Regras de Estilo

- **Sempre** utilizar as cores e estilos de `styles/systemStyle.ts`.
- O layout de páginas e modais deve ser sempre inspirado no sistema MAC e estilos minimalistas.
- Campos de valores devem utilizar `utils/money.ts`.
- Campos de quantidade devem utilizar `utils/quantityFormater.ts`.
- **Todas** as páginas devem seguir o mesmo padrão de estilo e layout definido em `systemStyles.page`.
- **Todos** os modais devem seguir o mesmo padrão definido em `systemStyles.modal`.
- Se faltar estilo para um novo tipo de componente, o estilo DEVE ser definido em `systemStyle.ts` para reutilização.
- Apesar de se basear no estilo do macOS, isso **NÃO deve ser citado** em comentários nem em nomes de arquivos.

---

## Hierarquia de Contraste (Temas)

As camadas de containers (plano de fundo, container intermediário e cards internos) devem manter o **mesmo padrão de contraste em todos os temas**:
- Se no tema dark o container é mais escuro que o fundo, o tema light deve respeitar a mesma hierarquia de tons.

---

## Formulários Premium

### Estrutura Visual
- Contêineres de cartões (`sectionCard`) com fundos suaves reativos ao tema.
- Cabeçalhos de seção (`sectionHeader`) com ícone do sistema (Feather Icons) envolto em círculo colorido semitransparente. **Nunca usar emojis.**
- Fontes: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

### Cards de Destaque e Feedback Dinâmico
- Campos interativos (Preço/Margem/Venda) com cartões individuais, bordas e fundos dinâmicos baseados no estado.
- Sufixos/unidades (como `%`) posicionados de forma estática e absoluta dentro do input.

### Grids e Tabelas
- Células clicáveis com alinhamento perfeito vertical e horizontal.
- Tabelas com cabeçalho sutil, linhas zebradas e botões de ação minimalistas.

---

## Campos Específicos

- **Placas e Chassis**: Sempre `toUpperCase()` no `onChange`.
- **Campos obrigatórios**: Asterisco (`*`) ao lado do label.
- **Documentos (CPF/CNPJ)**: Formatação dinâmica via `formatCpfOrCnpj`.
- **Mascaras**: Sempre formatar dados usando utilitários centralizados.

---

## Estilos Globais

- Estilos que se aplicam a toda a aplicação devem estar no `styles/reset.css`.
- Estilos de componentes devem estar no `styles/systemStyle.ts`.
- Componentes reutilizáveis devem utilizar hooks definidos em `hooks/`.
- **Fundo de Janelas Secundárias (CRÍTICO)**: Toda nova janela independente deve ter contêiner com `100vw/100vh` aplicando `systemColors.background.primary` para evitar que o fundo claro do `reset.css` "vaze" no tema dark.
