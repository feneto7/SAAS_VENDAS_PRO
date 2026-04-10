# VENDAS - Mobile App

Aplicativo dos vendedores construído com **React Native** e **Expo**.

## Características principais
- Registro rápido de vendas externas.
- Consulta de estoque vinculada ao vendedor.
- Listagem dinâmica de Clientes.
- Notificações de rotas.

## Instalação

```bash
cd mobile
npm install
```

## Configuração

Crie um arquivo `.env` na raiz da pasta `mobile` se houver necessidade de apontar para a URL da API em produção.

## Como Rodar

### Desenvolvimento Local:
```bash
npx expo start
```
Use o aplicativo **Expo Go** no seu celular para escanear o QR Code.

### Compilação nativa:
```bash
# Para gerar builds de testes (EAS Build)
eas build --profile development --platform android
```

## Organização Interna
- `/app`: Estrutura de navegação (Expo Router).
- `/components`: UI kit do aplicativo.
- `/lib`: Clientes de API e configurações.
