import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { 
  CreditCard, DollarSign, Percent, TrendingUp, Wallet, 
  ArrowRight, Plus, Calendar, Edit3, Info 
} from 'lucide-react-native';
import { Colors, Shadows, UI } from '../../../theme/theme';
import { CardItem, CardPayment, PaymentMethod } from '../hooks/useCardItemsData';
import { formatCentsToBRL, roundCents } from '../../../utils/money';
import { AddPaymentModal } from './AddPaymentModal';
import { EditCommissionModal } from './EditCommissionModal';
import { db } from '../../../services/database';
import { SyncService } from '../../../services/syncService';
interface Props {
  items: CardItem[];
  payments: CardPayment[];
  methods: PaymentMethod[];
  ficha: any;
  stats: any;
  isLocked?: boolean;
  onRefresh: () => void;
}

const SummaryCard = ({ label, value, icon: Icon, color, isSmall = false, onPress, subLabel, subLabelColor }: any) => (
  <TouchableOpacity 
    disabled={!onPress} 
    onPress={onPress}
    activeOpacity={0.7}
    style={[styles.card, isSmall && styles.cardSmall, { borderLeftColor: color }, onPress && styles.cardClickable]}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <Icon size={isSmall ? 16 : 20} color={color} />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
      {onPress && <Edit3 size={14} color={Colors.textMuted} style={{ marginLeft: 'auto' }} />}
    </View>
    <View style={styles.cardContent}>
      <Text style={[styles.cardValue, isSmall && styles.cardValueSmall, { color }]}>{formatCentsToBRL(value)}</Text>
      {subLabel && (
         <Text style={[styles.cardSubLabel, { color: subLabelColor || Colors.textMuted }]}>{subLabel}</Text>
      )}
    </View>
  </TouchableOpacity>
);

export const SettlementTab = ({ items, payments, methods, ficha, stats, isLocked, onRefresh }: Props) => {
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCommissionModalVisible, setIsCommissionModalVisible] = useState(false);

  // Rename to avoid property collision
  const isFichaLocked = !!isLocked;

  // Calculations
  const isPendente = ficha?.status === 'pendente' || ficha?.status === 'paga';

  const handleCancelPayment = (payment: CardPayment) => {
    if (payment.cancelled) return;

    Alert.alert(
      'Cancelar Pagamento',
      `Deseja realmente cancelar o pagamento de ${formatCentsToBRL(payment.amount)}?`,
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Local DB
              await db.runAsync(
                "UPDATE card_payments SET cancelled = 1 WHERE id = ?",
                [payment.id]
              );

              // 1.1 Local Auto-Pendente (Se estava paga, volta ao acerto)
              await db.runAsync(
                "UPDATE cards SET status = 'pendente' WHERE id = ? AND status = 'paga'",
                [ficha.id]
              );
              
              // 2. Sync
              await SyncService.enqueue('PATCH_CANCEL_PAYMENT', 'card_payments', {
                id: payment.id,
                card_id: ficha.id
              });

              onRefresh();
            } catch (e) {
              console.error('Cancel payment failed:', e);
            }
          }
        }
      ]
    );
  };

  const { totalCCRaw: totalCC, totalSC, totalToPay, totalPaid, balance: remaining } = stats;
  const commissionPercent = Number(ficha?.commissionPercent || 30);
  const commissionVal = roundCents(totalCC * (commissionPercent / 100));
  const netCCToPay = totalCC - commissionVal;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <SummaryCard label="Produtos CC" value={totalCC} icon={TrendingUp} color={Colors.primary} isSmall />
        </View>
        <View style={{ flex: 1 }}>
          <SummaryCard label="Produtos SC" value={totalSC} icon={Percent} color={Colors.info} isSmall />
        </View>
      </View>

      <SummaryCard 
        label="Comissão Produtos CC" 
        value={commissionVal} 
        icon={Percent} 
        color={Colors.warning}
        subLabel={`Margem de ${commissionPercent}% aplicada. Cliente paga ${formatCentsToBRL(netCCToPay)} neste grupo.`}
        subLabelColor={Colors.textSecondary}
        onPress={ficha?.status === 'paga' ? null : () => setIsCommissionModalVisible(true)}
      />

      <SummaryCard 
        label="Total a Pagar" 
        value={totalToPay} 
        icon={DollarSign} 
        color={Colors.success}
        subLabel="Soma do saldo CC + Total SC"
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <SummaryCard label="Pago" value={totalPaid} icon={Wallet} color={Colors.buttonSuccess} isSmall />
        </View>
        <View style={{ flex: 1 }}>
          <SummaryCard label="Restante" value={remaining} icon={ArrowRight} color={remaining > 0 ? Colors.danger : Colors.success} isSmall />
        </View>
      </View>

      {/* Payment Actions */}
      {ficha?.status !== 'paga' && (
        <TouchableOpacity 
          style={[UI.button, styles.addPaymentBtn]} 
          activeOpacity={0.8}
          onPress={() => setIsPaymentModalVisible(true)}
        >
          <Plus color={Colors.white} size={20} />
          <Text style={UI.buttonText}>Novo Pagamento</Text>
        </TouchableOpacity>
      )}

      {/* Payment List */}
      <View style={styles.paymentsSection}>
        <Text style={styles.sectionTitle}>Histórico de Pagamentos</Text>
        {payments.length === 0 ? (
          <View style={styles.emptyPayments}>
            <Text style={styles.emptyText}>Nenhum pagamento registrado.</Text>
          </View>
        ) : (
          payments.map((p) => (
            <TouchableOpacity 
              key={p.id} 
              style={[styles.paymentItem, p.cancelled && styles.paymentItemCancelled]}
              onPress={() => handleCancelPayment(p)}
              disabled={p.cancelled}
              activeOpacity={0.7}
            >
              <View style={[styles.paymentIcon, p.cancelled && { backgroundColor: Colors.danger + '15' }]}>
                <CreditCard size={16} color={p.cancelled ? Colors.danger : Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentMethod, p.cancelled && styles.paymentTextCancelled]}>
                  {p.method_name || 'Pagamento'}
                </Text>
                <View style={styles.paymentDateRow}>
                   <Calendar size={12} color={Colors.textMuted} />
                   <Text style={styles.paymentDate}>{new Date(p.payment_date).toLocaleDateString('pt-BR')}</Text>
                </View>
              </View>
              <Text style={[styles.paymentAmount, p.cancelled ? styles.paymentTextCancelled : { color: Colors.success }]}>
                {formatCentsToBRL(p.amount)}
              </Text>
              {p.cancelled && (
                <View style={styles.cancelledBadge}>
                   <Text style={styles.cancelledBadgeText}>CANCELADO</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>

      <AddPaymentModal
        visible={isPaymentModalVisible}
        onClose={() => setIsPaymentModalVisible(false)}
        onSave={onRefresh}
        cardId={ficha?.id}
        methods={methods}
        remainingAmount={remaining}
        status={ficha?.status}
        totalSC={totalSC}
        totalPaid={totalPaid}
      />

      <EditCommissionModal
        visible={isCommissionModalVisible}
        onClose={() => setIsCommissionModalVisible(false)}
        onSave={onRefresh}
        cardId={ficha?.id}
        totalCC={totalCC}
        currentPercent={commissionPercent}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  row: { flexDirection: 'row', width: '100%' },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 4,
    ...Shadows.black,
  },
  cardClickable: {
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.cardBg + 'F0',
  },
  cardSmall: { padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginLeft: 10, textTransform: 'uppercase' },
  cardContent: {},
  cardValue: { fontSize: 20, fontWeight: '900' },
  cardValueSmall: { fontSize: 16 },
  cardSubLabel: { fontSize: 10, marginTop: 4, fontWeight: '500', lineHeight: 14 },

  addPaymentBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 14,
  },

  paymentsSection: { marginTop: 30 },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  paymentIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.success + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  paymentMethod: { fontSize: 14, fontWeight: '700', color: Colors.white },
  paymentDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  paymentDate: { fontSize: 11, color: Colors.textMuted },
  paymentAmount: { fontSize: 15, fontWeight: '800', color: Colors.success },
  emptyPayments: { alignItems: 'center', padding: 20, opacity: 0.5 },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  
  paymentItemCancelled: {
    borderColor: Colors.danger + '20',
    opacity: 0.8,
  },
  paymentTextCancelled: {
    textDecorationLine: 'line-through',
    color: Colors.danger,
  },
  cancelledBadge: {
    backgroundColor: Colors.danger + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelledBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.danger,
  }
});
