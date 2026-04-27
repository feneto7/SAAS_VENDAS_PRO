/**
 * Normalizes and translates ficha status for Portuguese display.
 */
export const formatStatus = (status: string | undefined): string => {
  if (!status) return '---';
  
  const s = status.toLowerCase();
  
  switch (s) {
    case 'nova':
    case 'new':
      return 'NOVA';
    case 'pendente':
    case 'pending':
      return 'PENDENTE';
    case 'paga':
    case 'paid':
      return 'PAGA';
    case 'pedido':
    case 'order':
      return 'PEDIDO';
    case 'link_gerado':
      return 'LINK GERADO';
    default:
      return s.toUpperCase();
  }
};
