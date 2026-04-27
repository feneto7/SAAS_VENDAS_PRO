/**
 * Formata um valor em centavos (inteiro) para uma string de moeda BRL (ex: 200 -> "R$ 2,00")
 */
export function formatCentsToBRL(cents: number | string): string {
  const value = typeof cents === "string" ? parseInt(cents) : cents;
  if (isNaN(value)) return "R$ 0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

/**
 * Converte uma string BRL ou valor mascarado de volta para centavos (inteiro)
 * ex: "2,00" -> 200, "1.250,50" -> 125050
 */
export function parseBRLToCents(value: string): number {
  if (!value) return 0;
  
  // Remove tudo exceto números
  const digits = value.replace(/\D/g, "");
  return parseInt(digits) || 0;
}

/**
 * Aplica uma máscara de moeda a uma string de dígitos
 * ex: "200" -> "2,00", "125050" -> "1.250,50"
 */
export function applyCurrencyMask(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "0,00";
  
  const cents = parseInt(digits);
  const real = (cents / 100).toFixed(2);
  
  // Formata no estilo BRL sem o prefixo "R$" para o próprio input
  return real
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Arredonda um valor financeiro para garantir que permaneça como um inteiro de centavos.
 * Útil para cálculos de porcentagem/comissão.
 */
export function roundCents(value: number): number {
  return Math.round(value || 0);
}
