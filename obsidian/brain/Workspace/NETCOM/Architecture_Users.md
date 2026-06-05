# Arquitetura do Módulo de Usuários

## Objetivo
Gerenciar o controle de acesso, perfis de permissão e atribuições funcionais dos usuários do sistema.

## Extensões Funcionais: Operador e Comissão
Para integrar as funcionalidades de Vendas e Ordens de Serviço (OS), foram adicionadas duas novas flags ao cadastro de usuários:

1. **Operador (`is_operator` / `isOperator`):**
   - **Propósito:** Define se o usuário atua na operação de frente de caixa/vendas ou na execução de ordens de serviço.
   - **Regra de Negócio:** Somente os usuários marcados como `isOperator` serão carregados e disponibilizados para seleção no campo de "Operador/Vendedor" nas telas de Vendas (PDV) e Ordens de Serviço.

2. **Comissão (`receives_commission` / `receivesCommission`):**
   - **Propósito:** Define se o operador é comissionado.
   - **Regra de Negócio:** Esta opção é dependente do usuário ser um Operador. Se o checkbox "Operador" estiver desmarcado, o campo de "Comissão" é desabilitado e desmarcado automaticamente na UI. Usuários marcados com ambas as flags serão elegíveis para os cálculos de comissão de vendas/serviços configurados no sistema.

## Estrutura de Dados (`NewUserFormData`)
No modal `NewUserModal.tsx` e formulário `UserForm.tsx`, o estado estendido é composto por:

```typescript
interface NewUserFormData {
  id?: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  isOperator: boolean;          // Flag para identificar operador
  receivesCommission: boolean;  // Flag para identificar se comissionado
}
```

## Payload da API (`netcom-api`)
Ao salvar (tanto na criação via `POST /api/users` quanto na edição via `PUT /api/users/{id}`), as flags são enviadas convertidas para o padrão aceito pelo banco de dados (`1` ou `0`):

```json
{
  "name": "Nome do Usuário",
  "email": "usuario@email.com",
  "permission_profile_id": 1,
  "is_operator": 1,
  "receives_commission": 0
}
```

> [!WARNING]
> Como a política estrita do projeto proíbe edições diretas na `netcom-api` por este par de programação, o desenvolvedor do backend responsável deve ser notificado para incluir os campos `is_operator` e `receives_commission` (do tipo boolean/tinyint) na tabela `users` do banco de dados e expô-los nos endpoints de leitura, criação e atualização de usuários.
