import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
} from 'react-native';
import { CreditCard, Plus } from 'lucide-react-native';

interface CardSettlementTabProps {
  totals: {
    totalCardOriginal: number;
    calcTotalDevolvido: number;
    calcTotalVendido: number;
    totalSoldCC: number;
    commissionPercent: number;
    commissionVal: number;
    netCC: number;
    totalSoldSC: number;
    totalToPay: number;
    totalPaid: number;
    balance: number;
  };
  card: any;
  isPaid: boolean;
  onAddPayment: () => void;
  onCancelPayment: (paymentId: string) => void;
  formatCurrencyBRL: (val: number) => string;
}

export function CardSettlementTab({
  totals,
  card,
  isPaid,
  onAddPayment,
  onCancelPayment,
  formatCurrencyBRL
}: CardSettlementTabProps) {
  return (
    <View style={styles.container}>
      <SummaryItem label="VALOR TOTAL DA FICHA" value={totals.totalCardOriginal} formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label="PRODUTOS DEVOLVIDOS" value={totals.calcTotalDevolvido} variant="danger" formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label="PRODUTOS VENDIDOS" value={totals.calcTotalVendido} variant="success" formatCurrencyBRL={formatCurrencyBRL} />
      
      <View style={styles.divider} />
      
      <SummaryItem label="VENDAS COM COMISSÃO" value={totals.totalSoldCC} formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label={`COMISSÃO CLIENTE (${totals.commissionPercent}%)`} value={totals.commissionVal} variant="danger" formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label="VENDAS CC LÍQUIDAS" value={totals.netCC} isBold formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label="VENDAS SEM COMISSÃO" value={totals.totalSoldSC} formatCurrencyBRL={formatCurrencyBRL} />
      
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>TOTAL A PAGAR</Text>
        <Text style={styles.totalFinal}>{formatCurrencyBRL(totals.totalToPay)}</Text>
      </View>

      <View style={styles.statsRow}>
        <SummaryItem label="PAGAMENTO" value={totals.totalPaid} formatCurrencyBRL={formatCurrencyBRL} />
        <SummaryItem label="DESCONTO" value={card?.discount || 0} formatCurrencyBRL={formatCurrencyBRL} />
      </View>

      <View style={[styles.totalBox, { backgroundColor: 'rgba(167, 139, 250, 0.1)', borderColor: '#A78BFA' }]}>
        <Text style={[styles.totalLabel, { color: '#A78BFA' }]}>RESTANTE</Text>
        <Text style={[styles.totalFinal, { color: '#FFF' }]}>{formatCurrencyBRL(totals.balance)}</Text>
      </View>

      {!isPaid && (
        <View style={styles.paymentActions}>
           <Text style={styles.sectionTitle}>PAGAMENTOS</Text>
           <TouchableOpacity 
             style={styles.addPaymentBtn}
             onPress={onAddPayment}
           >
             <Plus size={20} color="#000" />
             <Text style={styles.addPaymentText}>PAGAMENTO</Text>
           </TouchableOpacity>
        </View>
      )}

      {isPaid && (
        <View style={styles.paymentActions}>
          <Text style={styles.sectionTitle}>PAGAMENTOS (BLOQUEADO)</Text>
        </View>
      )}

      {/* List of payments */}
      {card?.payments?.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum pagamento lançado</Text>
      ) : (
        card?.payments?.map((p: any) => (
          <TouchableOpacity 
            key={p.id} 
            style={[styles.paymentCard, isPaid && { opacity: 0.8 }]}
            onPress={() => !isPaid && !p.cancelled && onCancelPayment(p.id)}
            disabled={isPaid || p.cancelled}
          >
            <CreditCard size={18} color={p.cancelled ? "#EF4444" : "#A78BFA"} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.paymentMethod, p.cancelled && styles.cancelledText]}>{p.methodName}</Text>
              <Text style={styles.paymentDate}>{new Date(p.paymentDate).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.paymentAmount, p.cancelled && styles.paymentAmountCancelled]}>
              {formatCurrencyBRL(p.amount)}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

function SummaryItem({ label, value, variant, isBold, formatCurrencyBRL }: any) {
  const color = variant === 'success' ? '#10B981' : variant === 'danger' ? '#EF4444' : '#9CA3AF';
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryLabel, isBold && { fontWeight: '900', color: '#FFF' }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color }, isBold && { fontWeight: '900', fontSize: 18 }]}>{formatCurrencyBRL(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 120 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { color: '#6B7280', fontSize: 12, fontWeight: '700' },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#1F2937', marginVertical: 8 },
  totalBox: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4
  },
  totalLabel: { color: '#6B7280', fontSize: 12, fontWeight: '900' },
  totalFinal: { color: '#10B981', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', gap: 12 },
  paymentActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  addPaymentBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addPaymentText: { color: '#000', fontSize: 12, fontWeight: '900' },
  emptyText: { color: '#6B7280', fontSize: 14, textAlign: 'center', marginTop: 12 },
  paymentCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: 12,
    marginBottom: 8
  },
  paymentMethod: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  paymentDate: { color: '#4B5563', fontSize: 11 },
  paymentAmount: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  paymentAmountCancelled: { color: '#EF4444', textDecorationLine: 'line-through' },
  cancelledText: { textDecorationLine: 'line-through', color: '#6B7280' },
});
