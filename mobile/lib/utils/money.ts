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
