import { roundCents } from './money';

export function calculateFichaTotals(ficha: any, items: any[], payments: any[]) {
    // A ficha é considerada "fechada" para fins de cobrança se estiver no status pendente ou paga
    const isCurrentlyClosed = ficha?.status === 'pendente' || ficha?.status === 'paga';
    
    // Total CC (com comissão)
    const totalCCRaw = items
      .filter(i => (i.type === 'CC' || i.commission_type === 'CC'))
      .reduce((acc, curr) => {
        // Se estiver fechada (pendente/paga), usamos o vendido APENAS se o item já foi informado.
        // Se ainda não foi informado, usamos a quantidade total (prevendo o máximo a pagar).
        const qty = (isCurrentlyClosed && curr.is_informed) ? (curr.sold_quantity || 0) : curr.quantity;
        return acc + (qty * (curr.price || 0));
      }, 0);

    // Total SC (sem comissão e brindes)
    const totalSC = items
      .filter(i => (i.type !== 'CC' && i.commission_type !== 'CC')) 
      .reduce((acc, curr) => {
        const qty = (isCurrentlyClosed && curr.is_informed) ? (curr.sold_quantity || 0) : curr.quantity;
        return acc + (qty * (curr.price || 0));
      }, 0);
    
    const commP = Number(ficha?.commissionPercent || ficha?.commission_percent || 30);
    const commV = roundCents(totalCCRaw * (commP / 100));
    const totalToPay = roundCents((totalCCRaw - commV) + totalSC);
    
    const totalPaid = payments
      .filter(p => !p.cancelled)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    const discount = Number(ficha?.discount || 0);
    const balance = roundCents(totalToPay - totalPaid - discount);
    
    return {
      totalCCRaw,
      totalSC,
      totalToPay,
      totalPaid,
      balance,
      isPaid: balance <= 0 && isCurrentlyClosed
    };
}
