import { randomBytes } from 'node:crypto';

/**
 * Padrão de geração de SKU para a plataforma SAAS_VENDAS_PRO.
 * Gera um código no formato: PRD-XXXXXX (onde X é alfanumérico maiúsculo)
 * Usa o módulo crypto nativo do Node.js.
 */
export function generateProductSKU(): string {
  const bytes = randomBytes(4); // 4 bytes = 8 hex chars, we only need 6
  const id = bytes.toString('hex').toUpperCase().slice(0, 6);
  return `PRD-${id}`;
}
