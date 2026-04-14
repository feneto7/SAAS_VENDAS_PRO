# Padrões de Desenvolvimento - Mobile

## Navegação e Animações

- **Botão Voltar Customizado**: Sempre utilizar `router.back()` em vez de `router.navigate()` ou `router.push()` para ações de retorno. Isso garante a animação nativa de "pop" (slide da esquerda para a direita).
- **Stack Configuration**: O `Stack` no `_layout.tsx` deve ter `animation: 'slide_from_right'` como padrão global para manter a consistência visual.

## Formatação de Valores (Moeda)

- **Componente Central**: Utilizar OBRIGATORIAMENTE o utilitário `mobile/lib/utils/money.ts`.
- **Conversão**: Lembrar que o banco de dados armazena valores em **centavos (inteiro)**.
- **Exibição em Inputs**: Converter centavos para reais usando `centsToReais(val).toFixed(2).replace('.', ',')` para edição amigável ao usuário brasileiro.
- **Salvamento**: Converter de volta para centavos usando `reaisToCents(val)` antes de enviar para a API.

## Gestão de Estoque

- **Contexto do Vendedor**: Ao buscar produtos no App Mobile, sempre incluir o `sellerId` na query string (`/api/products?sellerId=...`).
- **Associação**: O backend deve realizar um `leftJoin` com `seller_inventory` para retornar a quantidade correta disponível para o vendedor logado.

## Interface (UI)

- **Botões Flutuantes (FAB)**: Seguir o padrão de fundo branco (`#FFF`) com sombra suave e ícone preto. Posicionamento dinâmico deve respeitar a presença de rodapés fixos (ex: subir o botão se o rodapé de "Finalizar" estiver visível).
