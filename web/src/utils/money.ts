/**
 * Formats a value in cents (integer) to a BRL currency string (e.g., 200 -> "R$ 2,00")
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
 * Parses a BRL string or masked value back to cents (integer)
 * e.g., "2,00" -> 200, "1.250,50" -> 125050
 */
export function parseBRLToCents(value: string): number {
  if (!value) return 0;
  
  // Remove everything except numbers
  const digits = value.replace(/\D/g, "");
  return parseInt(digits) || 0;
}

/**
 * Applies a currency mask to a string of digits
 * e.g., "200" -> "2,00", "125050" -> "1.250,50"
 */
export function applyCurrencyMask(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "0,00";
  
  const cents = parseInt(digits);
  const real = (cents / 100).toFixed(2);
  
  // Format as BRL style without the "R$" prefix for the input itself
  return real
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
