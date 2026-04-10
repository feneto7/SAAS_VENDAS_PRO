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

## Configuração

Crie um arquivo `.env` na raiz da pasta `web` com as seguintes variáveis:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
# Outras configurações como CLERK_PUBLISHABLE_KEY se necessário
```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor Next.js em modo de desenvolvimento.
- `npm run build`: Gera a build de produção otimizada.
- `npm run lint`: Executa a verificação lint para garantir qualidade de código.

## Organização Interna
- `/src/components/dashboard/tabs`: Módulos de cada aba principal (Vendas, Clientes, Produtos, etc).
- `/src/components/dashboard/shared`: Componentes genéricos reutilizáveis.
- `/src/utils`: Helpers para tratamento de dinheiro, datas e strings.
