# Implementação do Design System Neumórfico no App Mobile

Este plano detalha a refatoração do aplicativo mobile (`mobilev2`) para incorporar o sistema de design Neumórfico (com suporte a temas Claro e Escuro), espelhando a experiência visual premium da aplicação web.

## User Review Required
> [!IMPORTANT]
> **Limitações do React Native com Neumorfismo**: O React Native nativo não suporta sombras internas (`inset`) nem múltiplas sombras complexas (como o double-shot lighting) em um único elemento de forma nativa e performática. 
> A solução adotada na web recentemente (onde removemos o brilho duplo externo dos cards) facilitará muito. Usaremos sombras normais ("Drop Shadows") para os cards levantados e truques de bordas/cores para simular o "inset" (pressionado) nos inputs, mantendo a estética premium e garantindo 60fps no iOS e Android.
> Você aprova essa adaptação nativa das sombras?

## Proposed Changes

### 1. Gerenciamento de Estado do Tema (Zustand)
Criaremos um store para gerenciar o tema atual, permitindo troca dinâmica.

#### [NEW] `mobilev2/src/stores/useThemeStore.ts`
- Store do Zustand com a preferência de tema (light, dark, system).
- Selector para retornar as cores ativas baseado no modo atual.

### 2. Tokens de Design (Espelho da Web)
Refatoraremos o `theme.ts` atual, que é estático e hardcoded, para um sistema dinâmico.

#### [MODIFY] `mobilev2/src/theme/theme.ts`
- Mover as cores atuais estáticas para um objeto estruturado `lightTokens` e `darkTokens`.
- Os tokens seguirão a nomenclatura do web (`bg`, `surface`, `surfaceRaised`, `textPrimary`, `accent`, etc).
- Ajustar `GlobalStyles` e componentes `UI` para serem funções que recebem os `colors` atuais, ou substituí-los por componentes reais.

### 3. Componentes de UI Dinâmicos
Atualmente, componentes como `Button` e `Input` usam `Colors.xxx` diretamente. Eles precisam consumir o store de tema.

#### [MODIFY] `mobilev2/src/components/ui/Button.tsx`
- Refatorar para ler `colors` do `useThemeStore`.
- Adicionar variantes simulando o Neumorfismo (raised).

#### [MODIFY] `mobilev2/src/components/ui/Input.tsx`
- Refatorar para ler `colors`.
- Adicionar estilo "inset" (fundo mais escuro, bordas contrastantes).

### 4. Refatoração das Telas (Adaptação ao Hook de Tema)
Todas as telas precisarão importar o hook do tema e substituir o uso do `Colors` estático.

#### [MODIFY] Telas Principais
- `LoginScreen.tsx`
- `HomeScreen.tsx`
- `RoutesScreen.tsx`
- `CustomersScreen.tsx`
- `CustomerDetailScreen.tsx`
- `ChargeDetailScreen.tsx`
- `SelectTenant.tsx`
- Remover importação estática de `Colors` e `GlobalStyles`.
- Substituir por `const { colors } = useThemeStore()`.
- Garantir que o `StatusBar` altere para `dark-content` ou `light-content` dependendo do tema.

## Verification Plan

### Automated Tests
- Executar `tsc` para garantir que a mudança massiva de tipagem e a remoção do `Colors` estático não quebrou nenhuma interface.

### Manual Verification
- Iniciar o aplicativo no emulador/dispositivo.
- Testar a troca de tema (Claro/Escuro) na interface (podemos colocar um botão temporário no Header ou tela de configurações).
- Verificar o contraste e a leitura em ambas as plataformas (Android e iOS).
- Validar as sombras (elevação no Android e shadow no iOS) para não impactar a performance das listas (`FlatList`).
