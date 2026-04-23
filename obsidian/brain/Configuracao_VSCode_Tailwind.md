# Configuração do VS Code para Tailwind CSS

Para evitar que o VS Code e seus validadores de CSS nativos (Language Server) reportem falsos alertas como `Unknown at rule @tailwind`, `Unknown at rule @apply` ou `Unknown at rule @layer`, devemos sempre adicionar a seguinte configuração no arquivo `.vscode/settings.json` na raiz da workspace:

```json
{
  "css.lint.unknownAtRules": "ignore"
}
```

Isso garante que o editor não gere linhas vermelhas (warnings/erros visuais) em arquivos `.css` que utilizam diretivas válidas no ecossistema do Tailwind CSS (como Web, Expo, NativeWind, Next.js, etc). O build com o bundler correspondente já sabe lidar nativamente com a transpilação destas regras.
