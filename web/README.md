# VENDAS - Web Dashboard

Painel administrativo estratégico construído com **Next.js 16** (App Router) e **Tailwind CSS 4**.

## Características principais

- Interface Dark Mode Premium.
- Gestão modular baseada em abas (Tab-based modular loading).
- Auditoria de estoque em tempo real.
- Design responsivo e interações fluidas com Framer Motion.

## Instalação

```bash
cd web
npm install
```

## Configuração do Ambiente

Siga estes passos para configurar o projeto em uma nova máquina:

1. **Variáveis de Ambiente**:
   Na raiz da pasta `web`, você encontrará um arquivo chamado `.env.example`.
   - Crie uma cópia deste arquivo e renomeie para `.env`:
     ```bash
     cp .env.example .env
     ```
     ```
   - Abra o arquivo `.env` e certifique-se de que as chaves estão corretas:
     - `NEXT_PUBLIC_SERVER_URL`: URL do seu backend (ex: `http://localhost:3001`).

2. **Instalação de Dependências**:

   ```bash
   npm install
   ```

3. **Execução em Desenvolvimento**:
   ```bash
   npm run dev
   ```
   O painel estará acessível em `http://localhost:3000`.

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor Next.js em modo de desenvolvimento.
- `npm run build`: Gera a build de produção otimizada.
- `npm run lint`: Executa a verificação lint para garantir qualidade de código.

## Organização Interna

- `/src/components/dashboard/tabs`: Módulos de cada aba principal (Vendas, Clientes, Produtos, etc).
- `/src/components/dashboard/shared`: Componentes genéricos reutilizáveis.
- `/src/utils`: Helpers para tratamento de dinheiro, datas e strings.
