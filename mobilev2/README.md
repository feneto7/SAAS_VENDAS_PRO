# VENDAS Mobile v2

Aplicativo mobile cross-platform construído com **Expo** e **React Native**.

## Características principais

- Autenticação e gerenciamento de clientes
- Gestão de produtos e pedidos
- Detalhes de cartão com histórico de pagamentos
- Sincronização offline-first com SQLite
- UI com Tailwind CSS (NativeWind)
- Suporte para Android, iOS e Web

## Pré-requisitos

- **Node.js** >= 18
- **npm** ou **yarn**
- Para iOS: **Xcode** (macOS)
- Para Android: **Android Studio** + SDK
- Para testar localmente: **Expo Go** (aplicativo disponível na Play Store/App Store)

## Instalação

```bash
cd mobilev2
npm install
```

## Scripts Disponíveis

- `npm start`: Inicia o servidor Expo (menu interativo)
- `npm run android`: Abre direto no Android Emulator/dispositivo
- `npm run ios`: Abre direto no iOS Simulator
- `npm run web`: Abre na versão web (browser)

## Como Rodar

### Opção 1: Via Expo Go (mais rápido para testes)

```bash
npm start
```

Escaneie o QR code com:
- **iPhone**: Câmera nativa
- **Android**: Expo Go app

### Opção 2: Em emulador/dispositivo iOS

```bash
npm run ios
```

Requer macOS com Xcode instalado.

### Opção 3: Em emulador/dispositivo Android

```bash
npm run android
```

Certifique-se que o Android Emulator está rodando ou dispositivo conectado.

### Opção 4: Na Web

```bash
npm run web
```

Abre em um navegador local.

## Estrutura do Projeto

```
src/
├── components/       # Componentes reutilizáveis (Button, Input, etc)
├── Screens/          # Telas principais
│   ├── Login/
│   ├── Home/
│   ├── Customers/
│   ├── Charges/
│   ├── CardDetail/
│   └── Routes/
├── services/         # APIs e banco de dados
│   ├── database.ts    # SQLite
│   ├── sync.ts        # Sincronização
│   └── syncService.ts
├── stores/           # Zustand (estado global)
│   ├── useAuthStore.ts
│   └── useNavigationStore.ts
├── theme/            # Estilos (Tailwind + CSS)
└── utils/            # Utilitários (formatação de valores, etc)
```

## Configuração

### .env (se aplicável)

Se precisar de variáveis de ambiente para API/Backend:

Crie um arquivo `.env.local`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_TENANT_ID=seu-tenant-id
```

Note: No Expo, apenas variáveis com prefixo `EXPO_PUBLIC_` são acessíveis.

## Dependências principais

- **expo**: Framework React Native
- **react-native**: Runtime nativo
- **zustand**: Gerenciamento de estado
- **axios**: HTTP client
- **expo-sqlite**: Banco de dados local
- **lucide-react-native**: Ícones
- **nativewind**: Tailwind para React Native

## Troubleshooting

### Erro ao rodar `npm start`

```bash
# Limpe o cache e reinstale
rm -rf node_modules package-lock.json
npm install
npm start
```

### Android Emulator não aparece

```bash
# Liste dispositivos disponíveis
adb devices

# Se vazio, abra o Android Studio e crie um device virtual
```

### Erro de dependências no iOS

```bash
cd ios
pod install
cd ..
npm run ios
```

## Desenvolvimento

Ao modificar código, o Expo fará reload automático (Fast Refresh). Se tiver problemas, pressione `r` no terminal para forçar reload.

Para debug, use:
- React Native Debugger (ferramenta externa)
- Console logs + Expo Go logs
- DevTools do Expo

## Deploy

Para gerar builds:

```bash
# Usar Expo EAS (recomendado)
npm install -g eas-cli
eas build --platform ios
eas build --platform android

# Ou gerar APK/AAB localmente com Expo
expo export --platform android
```
