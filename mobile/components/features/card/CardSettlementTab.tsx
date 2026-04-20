import React from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
} from 'react-native';
import { CreditCard, Plus } from 'lucide-react-native';
import { useThemeColor } from '../../../components/Themed';

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
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const placeholderColor = useThemeColor({}, 'placeholder');

  return (
    <DefaultView style={styles.container}>
      <SummaryItem label="VALOR TOTAL DA FICHA" value={totals.totalCardOriginal} formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label="PRODUTOS DEVOLVIDOS" value={totals.calcTotalDevolvido} variant="danger" formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label="PRODUTOS VENDIDOS" value={totals.calcTotalVendido} variant="success" formatCurrencyBRL={formatCurrencyBRL} />
      
      <DefaultView style={[styles.divider, { backgroundColor: borderColor }]} />
      
      <SummaryItem label="VENDAS COM COMISSÃO" value={totals.totalSoldCC} formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label={`COMISSÃO CLIENTE (${totals.commissionPercent}%)`} value={totals.commissionVal} variant="danger" formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label="VENDAS CC LÍQUIDAS" value={totals.netCC} isBold formatCurrencyBRL={formatCurrencyBRL} />
      <SummaryItem label="VENDAS SEM COMISSÃO" value={totals.totalSoldSC} formatCurrencyBRL={formatCurrencyBRL} />
      
      <DefaultView style={[styles.totalBox, { backgroundColor: cardColor, borderColor }]}>
        <DefaultText style={[styles.totalLabel, { color: secondaryColor }]}>TOTAL A PAGAR</DefaultText>
        <DefaultText style={[styles.totalFinal, { color: successColor }]}>{formatCurrencyBRL(totals.totalToPay)}</DefaultText>
      </DefaultView>

      <DefaultView style={styles.statsRow}>
        <SummaryItem label="PAGAMENTO" value={totals.totalPaid} formatCurrencyBRL={formatCurrencyBRL} />
        <SummaryItem label="DESCONTO" value={card?.discount || 0} formatCurrencyBRL={formatCurrencyBRL} />
      </DefaultView>

      <DefaultView style={[styles.totalBox, { backgroundColor: primaryColor + '10', borderColor: primaryColor }]}>
        <DefaultText style={[styles.totalLabel, { color: primaryColor }]}>RESTANTE</DefaultText>
        <DefaultText style={[styles.totalFinal, { color: textColor }]}>{formatCurrencyBRL(totals.balance)}</DefaultText>
      </DefaultView>

      {!isPaid && (
        <DefaultView style={styles.paymentActions}>
           <DefaultText style={[styles.sectionTitle, { color: textColor }]}>PAGAMENTOS</DefaultText>
           <TouchableOpacity 
             style={[styles.addPaymentBtn, { backgroundColor: successColor }]}
             onPress={onAddPayment}
           >
             <Plus size={20} color="#fff" />
             <DefaultText style={[styles.addPaymentText, { color: '#fff' }]}>PAGAMENTO</DefaultText>
           </TouchableOpacity>
        </DefaultView>
      )}

      {isPaid && (
        <DefaultView style={styles.paymentActions}>
          <DefaultText style={[styles.sectionTitle, { color: textColor }]}>PAGAMENTOS (BLOQUEADO)</DefaultText>
        </DefaultView>
      )}

      {/* List of payments */}
      {card?.payments?.length === 0 ? (
        <DefaultText style={[styles.emptyText, { color: secondaryColor }]}>Nenhum pagamento lançado</DefaultText>
      ) : (
        card?.payments?.map((p: any) => (
          <TouchableOpacity 
            key={p.id} 
            style={[styles.paymentCard, { backgroundColor: cardColor }, isPaid && { opacity: 0.8 }]}
            onPress={() => !isPaid && !p.cancelled && onCancelPayment(p.id)}
            disabled={isPaid || p.cancelled}
          >
            <CreditCard size={18} color={p.cancelled ? errorColor : primaryColor} />
            <DefaultView style={{ flex: 1, marginLeft: 12 }}>
              <DefaultText style={[styles.paymentMethod, { color: textColor }, p.cancelled && styles.cancelledText]}>{p.methodName}</DefaultText>
              <DefaultText style={[styles.paymentDate, { color: secondaryColor }]}>{new Date(p.paymentDate).toLocaleDateString()}</DefaultText>
            </DefaultView>
            <DefaultText style={[styles.paymentAmount, { color: textColor }, p.cancelled && styles.paymentAmountCancelled]}>
              {formatCurrencyBRL(p.amount)}
            </DefaultText>
          </TouchableOpacity>
        ))
      )}
    </DefaultView>
  );
}

function SummaryItem({ label, value, variant, isBold, formatCurrencyBRL }: any) {
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const secondaryColor = useThemeColor({}, 'secondary');
  const textColor = useThemeColor({}, 'text');

  const color = variant === 'success' ? successColor : variant === 'danger' ? errorColor : secondaryColor;
  return (
    <DefaultView style={styles.summaryItem}>
      <DefaultText style={[styles.summaryLabel, { color: isBold ? textColor : secondaryColor }, isBold && { fontWeight: '900' }]}>{label}</DefaultText>
      <DefaultText style={[styles.summaryValue, { color }, isBold && { fontWeight: '900', fontSize: 18 }]}>{formatCurrencyBRL(value)}</DefaultText>
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 120 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { fontSize: 12, fontWeight: '700' },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  divider: { height: 1, marginVertical: 8 },
  totalBox: { 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4
  },
  totalLabel: { fontSize: 12, fontWeight: '900' },
  totalFinal: { fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  statsRow: { flexDirection: 'row', gap: 12 },
  paymentActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  addPaymentBtn: { paddingHorizontal: 16, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  addPaymentText: { fontSize: 12, fontWeight: '900' },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 12 },
  paymentCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12,
    marginBottom: 8
  },
  paymentMethod: { fontSize: 14, fontWeight: '700' },
  paymentDate: { fontSize: 11 },
  paymentAmount: { fontSize: 16, fontWeight: '900' },
  paymentAmountCancelled: { textDecorationLine: 'line-through' },
  cancelledText: { textDecorationLine: 'line-through' },
});
