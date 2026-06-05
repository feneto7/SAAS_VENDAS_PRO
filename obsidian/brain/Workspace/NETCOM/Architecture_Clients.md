# Arquitetura do Módulo de Clientes (com Veículos de Oficina)

## Objetivo
Permitir a gestão completa dos dados cadastrais dos clientes, incluindo a associação de um ou mais **Veículos** vinculados. Esse recurso é fundamental para estabelecimentos de tipo oficina, onde a Ordem de Serviço (O.S.) necessita da identificação do veículo deixado para manutenção.

## Estrutura de Dados (`Client` & `Vehicle`)

```typescript
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  type: 'individual' | 'company';
  status: 'active' | 'inactive';
  registrationDate: string;
  vehicles?: Vehicle[]; // Lista opcional de veículos do cliente
}

interface Vehicle {
  id: string;
  model: string;   // Modelo (Obrigatório)
  brand: string;   // Marca (Obrigatório)
  plate: string;   // Placa (Obrigatório)
  year?: string;   // Ano (Opcional)
  color?: string;  // Cor (Opcional)
  chassis?: string;// Chassi (Opcional)
}
```

## Modal Unificado (`NewClientModal`)
O formulário de cadastro de novo cliente está localizado em [NewClientModal.tsx](file:///c:/WORKSPACE/netcom-front/src/renderer/components/NewClientModal/NewClientModal.tsx) e foi estendido com o suporte ao gerenciamento de múltiplos veículos na aba correspondente:

1. **Estrutura das Abas:**
   - **Principal:** Dados básicos do cliente (Nome, CPF/CNPJ, E-mail, Telefone, Inscrições e Status).
   - **Endereço:** CEP, Logradouro, Número, Bairro, Cidade e Estado/UF.
   - **Adicional:** Observações adicionais.
   - **Limite:** Limite de crédito, prazo de vencimento e percentual de desconto.
   - **Planos:** Seleção e vinculação de planos de serviço via Catálogo.
   - **Veículos (Nova):** Listagem de veículos com gerenciamento de cadastro local.

2. **Componente de Aba de Veículos (`VehiclesTab`):**
   - Localizado em [VehiclesTab.tsx](file:///c:/WORKSPACE/netcom-front/src/renderer/components/NewClientModal/components/VehiclesTab.tsx).
   - Apresenta os veículos em uma tabela estruturada sob o grid macOS do projeto.
   - Fornece botão de ação para criar um **Novo Veículo** ou **Editar/Excluir** registros já associados na lista local antes de consolidar o salvamento.

3. **Sub-modal de Formulário de Veículo (`VehicleFormModal`):**
   - Acoplado internamente ao componente de aba para simplificar o ciclo de vida dos dados temporários.
   - **Validação de Campos:** Exige obrigatoriamente Marca, Modelo e Placa.
   - **Formatação Automática:** Converte as strings de **Placa** e **Chassi** automaticamente em caixa alta (`toUpperCase`) para consistência e elegância visual.
   - O campo Placa possui limite estrito de 8 caracteres.

## Salvar Cliente com Veículos
Ao finalizar o preenchimento, o botão "Salvar Cliente" invoca a prop `onSave` enviando o payload completo contendo os dados cadastrais estruturados e a lista de veículos:

```typescript
const newClient = {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  document: formData.document,
  type: clientType,
  status: 'active' as const,
  vehicles: formData.vehicles
};
```

> [!NOTE]
> Essa arquitetura garante o preenchimento e armazenamento seguro e flexível de múltiplos carros/veículos de oficina sem a necessidade de cadastros duplicados de clientes.
