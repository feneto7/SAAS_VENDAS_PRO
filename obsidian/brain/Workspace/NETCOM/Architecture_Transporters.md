# Arquitetura do Módulo de Transportadores

## Objetivo
Gerenciar a listagem, cadastro e seleção de Transportadores no sistema. Transportadores são fundamentais na emissão de Notas Fiscais Eletrônicas (NF-e), onde a especificação do frete exige a identificação do transportador encarregado, seja ele Pessoa Física (PF) ou Pessoa Jurídica (PJ).

## Estrutura de Navegação e Rotas

1. **Definição da Rota:**
   - Adicionada `'transporters'` na listagem de rotas do frontend no arquivo [Navigation.tsx](file:///c:/WORKSPACE/netcom-front/src/renderer/router/Navigation.tsx):
     ```typescript
     export type Route = 'tenant' | 'login' | 'home' | 'products' | 'clients' | 'suppliers' | 'transporters' | 'users' | ...;
     ```

2. **Botão no Menu Superior (TopMenu):**
   - Inserido no menu central do [TopMenu.tsx](file:///c:/WORKSPACE/netcom-front/src/renderer/pages/Home/components/TopMenu.tsx) utilizando o ícone de caminhão (`AppIcons.Truck` / `FiTruck`):
     ```tsx
     <MenuButton 
       icon={AppIcons.Truck} 
       label="Transportadores" 
       onClick={() => navigate('transporters')}
     />
     ```

3. **Mapeamento de Renderização:**
   - Integrado de forma preguiçosa (Lazy loading) no [App.tsx](file:///c:/WORKSPACE/netcom-front/src/renderer/App.tsx):
     ```typescript
     const Transporters = lazy(() => import('./pages/Transporters/Transporters').then(module => ({ default: module.Transporters })));
     ```

## Estrutura de Dados (`Transporter`)
O componente de transportadores armazena e manipula a seguinte estrutura:

```typescript
interface Transporter {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;              // CPF (PF) ou CNPJ (PJ)
  type: 'individual' | 'company'; // PF ou PJ
  city: string;                  // Necessário para NFe
  state: string;                 // Necessário para NFe (UF)
  status: 'active' | 'inactive';
  fantasyName?: string;          // Opcionais para PJ
  stateRegistration?: string;
  municipalRegistration?: string;
  address?: string;              // Endereço completo
  addressNumber?: string;
  neighborhood?: string;
  zipCode?: string;
  licensePlate?: string;         // Placa do Veículo (para NF-e)
  vehicleState?: string;         // UF do Veículo (para NF-e)
  rntrc?: string;                // Registro Nacional de Transportadores (ANTT)
}
```

## Modal de Cadastro e Edição (`NewTransporterModal`)
Implementado em [NewTransporterModal.tsx](file:///c:/WORKSPACE/netcom-front/src/renderer/pages/Transporters/components/NewTransporterModal.tsx), o modal unificado de criação/edição oferece uma experiência premium segmentada em 3 abas principais:

1. **Aba Principal:**
   - Dados básicos (Nome/Razão Social, Nome Fantasia, CPF/CNPJ, Telefone, E-mail, Inscrições e Status).
   - Alternância dinâmica entre Pessoa Física (PF) e Pessoa Jurídica (PJ) com limpeza automática e formatação de máscaras via utilitário `formatCpfOrCnpj`.

2. **Aba Endereço:**
   - CEP, Logradouro, Número, Bairro, Cidade e UF.
   - Validação e consistência de dados (Cidade e Estado são campos obrigatórios para compor a tag `<transportadora>` da NF-e).

3. **Aba Veículo & ANTT:**
   - Placa do Veículo (conversão em tempo real para caixa alta e limite de 7 caracteres).
   - UF do Veículo (2 caracteres).
   - RNTRC / Registro de ANTT (campo numérico).

## Integração de Ações na Tela Principal
A tela principal gerencia o estado da listagem contendo:
- **`handleCreate`:** Abre o modal para cadastrar novo transportador com formulário limpo.
- **`handleEdit`:** Preenche todos os campos correspondentes do transportador selecionado no modal.
- **`handleSaveTransporter`:** Trata a inclusão de um novo registro (gerando `id` com `Date.now()`) ou atualização do item correspondente no array de estados.
- **`handleDelete`:** Exclusão segura após janela de confirmação nativa.

## Homogeneidade Estética e Layout macOS
- A página e o modal seguem exatamente os padrões de design macOS minimalista definidos em `styles/systemStyle.ts`.
- Usa os utilitários de tema (`useTheme`) para garantir contraste impecável tanto no modo Dark quanto no Light.
- Componente contém barra de pesquisa integrada por nome, documento ou cidade, tabela estruturada em grid, badges estilizadas para diferenciação de PF/PJ e ações de edição/exclusão.
- Sons de feedback integrados perfeitamente com `useClickSound()`.

> [!NOTE]
> Este módulo está 100% completo no frontend, pronto e integrado à tela principal para cadastro, edição e exclusão simulada de dados em tempo de execução.
