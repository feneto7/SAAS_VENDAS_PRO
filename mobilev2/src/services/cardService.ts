import { db } from './database';
import { calculateFichaTotals } from '../utils/calculations';

export const CardService = {
  /**
   * Recalcula o total de uma ficha com base nos itens e pagamentos locais
   * e persiste o resultado na tabela 'cards'.
   * Útil para manter a consistência entre telas (ex: Detalhes -> Lista de Clientes).
   */
  async syncLocalTotal(cardId: string) {
    try {
      // 1. Carregar Dados Atuais
      const [ficha] = await db.getAllAsync<any>(
        "SELECT status, commission_percent, discount, items_locked FROM cards WHERE id = ?",
        [cardId]
      );
      if (!ficha) return;

      const items = await db.getAllAsync<any>(
        "SELECT type, quantity, sold_quantity, price, is_informed FROM card_items WHERE card_id = ?",
        [cardId]
      );

      const payments = await db.getAllAsync<any>(
        "SELECT amount, cancelled FROM card_payments WHERE card_id = ?",
        [cardId]
      );

      // 2. Calcular usando a regra centralizada
      const { totalToPay, balance } = calculateFichaTotals(
        { 
          status: ficha.status, 
          commissionPercent: ficha.commission_percent,
          discount: ficha.discount
        }, 
        items, 
        payments
      );

      // 3. Determinar Status Automático
      // REGRA DE OURO: Só vira PAGA se saldo <= 0 AND todos os itens foram conferidos (is_informed).
      const informedCount = items.filter(i => !!i.is_informed).length;
      const allItemsInformed = items.length > 0 && informedCount === items.length;
      
      console.log(`[CardService] Recalculating status for ${cardId}: Balance=${balance}, Locked=${ficha.items_locked}, Informed=${informedCount}/${items.length}, CurrentStatus=${ficha.status}`);

      if (!allItemsInformed && balance <= 0 && ficha.items_locked) {
        const missing = items.filter(i => !i.is_informed).map(i => i.product_name || i.product_id);
        console.log(`[CardService] Blocking PAGA transition because ${items.length - informedCount} items are not informed:`, missing);
      }

      let newStatus = ficha.status;
      
      // Se estiver bloqueada E saldo <= 0 E tudo conferido -> PAGA
      if (ficha.items_locked && balance <= 0 && allItemsInformed) {
          newStatus = 'paga';
      }
      // Se balance > 0 (ex: cancelou pagamento) e estava PAGA, volta a PENDENTE.
      else if (balance > 0 && ficha.status === 'paga') {
          newStatus = 'pendente';
      }

      // 4. Salvar no Banco Local
      await db.runAsync(
        "UPDATE cards SET total = ?, status = ?, last_manual_update = ? WHERE id = ?",
        [totalToPay, newStatus, new Date().toISOString(), cardId]
      );

      console.log(`[CardService] Local total synced for ${cardId}: ${totalToPay} (Status: ${newStatus})`);
      return { totalToPay, newStatus };
    } catch (e) {
      console.error('[CardService] Failed to sync local total:', e);
      throw e;
    }
  }
};
