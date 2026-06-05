# Arquitetura do Módulo de Gaveta de Dinheiro

## Objetivo
Capturar e configurar a porta de comunicação de hardware para o acionamento e abertura automática da gaveta de dinheiro acoplada ao PDV/caixa.

## Estrutura de Dados (`CashDrawerSettings`)

```typescript
export interface CashDrawerSettings {
  enabled: boolean;        // Ativar a abertura automática no fechamento da venda
  port: string;            // Porta de comunicação (ex: COM1, COM2, LPT1, USB)
}
```

## UI & Padrões Visuais
- A tela reside na aba "Gaveta" do painel de Configurações (`Settings.tsx` -> `<CashDrawerForm />`).
- Segue a identidade visual macOS com as cores padrão do sistema.
- Fornece um menu `<select>` com uma lista predefinida das portas mais comuns em hardwares de automação comercial brasileira (COM1 a COM6, LPT1, USB).
- Possui um botão "Testar Abertura" que enviará o comando de teste.

## Integração com a API Backend (netcom-api)
Em sistemas web, o navegador (React) roda em uma "sandbox" de segurança e **não possui acesso direto a portas seriais ou USB locais**. Portanto:
1. O backend Laravel deverá ter rotas (`GET/POST`) para recuperar e persistir qual é a porta configurada no banco de dados daquele terminal.
2. O disparo da gaveta (envio de pulsos hexadecimais para a porta local, como `\x1B\x70\x00\x19\xFA`) deverá ser implementado no backend ou num micro-serviço/bridge local (ex: executável auxiliar rodando na máquina que escute a API e dispare na porta COM física). 
3. O Frontend terá o papel apenas de sinalizar (ex: ao finalizar a venda, a API Laravel processa a venda e, caso a flag `enabled` seja `true`, sinaliza a abertura da gaveta configurada na porta `port`).
