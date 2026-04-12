# Vendas PRO - Mobile (Expo)

Aplicativo mobile para vendedores e logística. Utiliza Expo Router e Clerk para autenticação.

## 🚀 Como Executar

### 1. Configuração do Ambiente

Certifique-se de ter o arquivo `.env` na raiz da pasta `mobile` (eu já criei para você) com o seguinte conteúdo:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_cG9wdWxhci1hbnQtOTQuY2xlcmsuYWNjb3VudHMuZGV2JA
```

> **Nota:** Se você for rodar em um dispositivo físico, substitua `localhost` pelo endereço IP do seu computador (ex: `192.168.1.10`).

### 2. Instalação

Se ainda não instalou as dependências:

```bash
npm install
```

### 3. Iniciar o Expo

```bash
npm start
```

Pressione `a` para abrir no Android, `i` para iOS ou escaneie o QR Code com o aplicativo **Expo Go** no seu celular.

## 🗝️ Fluxo de Login

1. **Código da Empresa**: No primeiro acesso, digite o slug da sua empresa (ex: `vendas-ltda`).
2. **Login de Vendedor**: Use o seu código de vendedor e senha cadastrados no painel administrativo.
