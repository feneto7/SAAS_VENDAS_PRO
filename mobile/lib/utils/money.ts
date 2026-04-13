/**
 * Converts value from cents (integer) to reais (float)
 */
export const centsToReais = (cents: number): number => {
  if (!cents || isNaN(cents)) return 0;
  return cents / 100;
};

/**
 * Converts value from reais (float) to cents (integer)
 */
export const reaisToCents = (reais: number | string): number => {
  if (typeof reais === 'string') {
    reais = parseFloat(reais.replace(',', '.'));
  }
  if (!reais || isNaN(reais)) return 0;
  return Math.round(reais * 100);
};

/**
 * Formats a numeric value (cents or reais) to BRL string
 */
export const formatCurrencyBRL = (value: number, inputIsCents = true): string => {
  const amount = inputIsCents ? centsToReais(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
};

/**
 * Applies a currency mask to a string of digits (e.g., "1250" -> "12,50")
 */
export const applyCurrencyMask = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "0,00";
  
  const cents = parseInt(digits);
  const real = (cents / 100).toFixed(2);
  
  return real
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Parses a masked value back to cents
 */
export const parseBRLToCents = (value: string): number => {
  if (!value) return 0;
  const digits = value.replace(/\D/g, "");
  return parseInt(digits) || 0;
};
