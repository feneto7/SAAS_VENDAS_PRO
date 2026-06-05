# Arquitetura do Módulo de Configuração de E-mail (SMTP)

## Objetivo
Padronizar e gerenciar as configurações de servidor SMTP que o backend (Laravel) utilizará para disparar e-mails automáticos do sistema (boletos, relatórios, notas fiscais, alertas e cobranças de clientes).

## Decisão Arquitetural: Client vs Server
Foi decidido que **o Frontend (Electron/React) NÃO deve disparar e-mails diretamente**.
- **Motivo de Segurança:** O Frontend não deve armazenar senhas brutas de SMTP expostas no código ou na memória do client local de forma definitiva.
- **Motivo Técnico:** Disparos pesados, como PDFs de relatórios ou Notas Fiscais em lote, são processados pelo Backend.
- **Padrão:** O Frontend funciona estritamente como uma interface de captura. Ele monta o payload `EmailSettings` e o envia para a API Laravel. A API armazena as credenciais (idealmente encriptadas no banco de dados) e utiliza o serviço de `Mail` nativo do Laravel (`config/mail.php`) para despachar as mensagens.

## Estrutura de Dados (`EmailSettings`)

O formulário gerencia o seguinte estado:

```typescript
export interface SmtpSettings {
  host: string;            // Ex: smtp.gmail.com
  port: number;            // Ex: 587 (TLS) ou 465 (SSL)
  encryption: 'tls' | 'ssl' | 'none';
  username: string;        // E-mail de autenticação
  password: string;        // Senha ou Senha de Aplicativo (App Password)
}

export interface SenderSettings {
  senderName: string;      // Nome de exibição (Ex: Netcom Financeiro)
  senderEmail: string;     // E-mail de remetente visível
}

export interface EmailSettings {
  enabled: boolean;        // Chave liga/desliga para envios globais
  smtp: SmtpSettings;
  sender: SenderSettings;
}
```

## UI & Padrões Visuais
- A tela reside na aba "E-mail" (`Settings.tsx` -> `<EmailForm />`).
- Segue a identidade visual macOS com **Cards Arredondados** e bordas cinza claro.
- Foi reutilizado o componente global `InfoTooltip` recém-criado para explicar campos complexos aos usuários (como a diferença entre portas TLS/SSL e a necessidade de "Senhas de Aplicativo" para Gmail/Outlook).
- O campo de senha (`password`) inclui um ícone visual (Eye/EyeOff) nativo do sistema de `AppIcons` para alternar a visibilidade de forma segura.
- **Auto-preenchimento Inteligente:** O campo de Host SMTP foi otimizado para ser um *dropdown* contendo os provedores mais comuns (Gmail, Outlook, Yahoo, Zoho, Locaweb, Hostinger). Ao selecionar um deles, a Porta e Criptografia ideais são configuradas automaticamente. A opção "Outro" habilita o input de texto livre.

## Próximos Passos (Backend)
1. Criar Migration e Controller no Laravel para receber o payload `EmailSettings`.
2. Criar uma rota de `Testar Conexão` que faça uma tentativa real de handshake SMTP.
3. Criptografar as senhas do SMTP (`Hash` ou `Crypt::encryptString`) no banco de dados.
