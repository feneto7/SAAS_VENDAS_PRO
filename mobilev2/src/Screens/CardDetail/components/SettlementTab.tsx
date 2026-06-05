import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { 
  CreditCard, DollarSign, Percent, TrendingUp, Wallet, 
  ArrowRight, Plus, Calendar, Edit3, Info 
} from 'lucide-react-native';
import { useTheme } from '../../../stores/useThemeStore';
import { Shadows, getUIStyles } from '../../../theme/theme';
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
  card: any;
  stats: {
    totalCCRaw: number;
    totalSC: number;
    totalToPay: number;
    totalPaid: number;
    balance: number;
    isPaid?: boolean;
  };
  isLocked?: boolean;
  onRefresh: () => void;
  collectionId?: string;
}

export const SettlementTab = ({ items, payments, methods, card, stats, isLocked, onRefresh, collectionId }: Props) => {
  const { colors, isDark } = useTheme();
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isCommissionModalVisible, setIsCommissionModalVisible] = useState(false);
  
  const isFichaLocked = !!isLocked;

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
        {onPress && <Edit3 size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardValue, isSmall && styles.cardValueSmall, { color }]}>{formatCentsToBRL(value)}</Text>
        {subLabel && (
           <Text style={[styles.cardSubLabel, { color: subLabelColor || colors.textMuted }]}>{subLabel}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

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
                [card.id]
              );
              
              // 2. Sync
              await SyncService.enqueue('PATCH_CANCEL_PAYMENT', 'card_payments', {
                id: payment.id,
                card_id: card.id
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
  const commissionPercent = Number(card?.commissionPercent || 30);
  const commissionVal = roundCents(totalCC * (commissionPercent / 100));
  const netCCToPay = totalCC - commissionVal;
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <SummaryCard label="Produtos CC" value={totalCC} icon={TrendingUp} color={colors.accent} isSmall />
        </View>
        <View style={{ flex: 1 }}>
          <SummaryCard label="Produtos SC" value={totalSC} icon={Percent} color={colors.info} isSmall />
        </View>
      </View>

      <SummaryCard 
        label="Comissão Produtos CC" 
        value={commissionVal} 
        icon={Percent} 
        color={colors.warning}
        subLabel={`Margem de ${commissionPercent}% aplicada. Cliente paga ${formatCentsToBRL(netCCToPay)} neste grupo.`}
        subLabelColor={colors.textSecondary}
        onPress={card?.status === 'paga' ? null : () => setIsCommissionModalVisible(true)}
      />

      <SummaryCard 
        label="Total a Pagar" 
        value={totalToPay} 
        icon={DollarSign} 
        color={colors.success}
        subLabel="Soma do saldo CC + Total SC"
      />

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <SummaryCard label="Pago" value={totalPaid} icon={Wallet} color={colors.buttonSuccess || colors.success} isSmall />
        </View>
        <View style={{ flex: 1 }}>
          <SummaryCard label="Restante" value={remaining} icon={ArrowRight} color={remaining > 0 ? colors.danger : colors.success} isSmall />
        </View>
      </View>

      {/* Payment Actions */}
      {card?.status !== 'paga' && (
        <TouchableOpacity 
          style={[UI.button, styles.addPaymentBtn]} 
          activeOpacity={0.8}
          onPress={() => setIsPaymentModalVisible(true)}
        >
          <Plus color={colors.white} size={20} />
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
              <View style={[styles.paymentIcon, p.cancelled && { backgroundColor: colors.danger + '15' }]}>
                <CreditCard size={16} color={p.cancelled ? colors.danger : colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentMethod, p.cancelled && styles.paymentTextCancelled]}>
                  {p.method_name || 'Pagamento'}
                </Text>
                <View style={styles.paymentDateRow}>
                   <Calendar size={12} color={colors.textMuted} />
                   <Text style={styles.paymentDate}>{new Date(p.payment_date).toLocaleDateString('pt-BR')}</Text>
                </View>
              </View>
              <Text style={[styles.paymentAmount, p.cancelled ? styles.paymentTextCancelled : { color: colors.success }]}>
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
        cardId={card?.id}
        methods={methods}
        remainingAmount={remaining}
        status={card?.status}
        totalSC={totalSC}
        totalPaid={totalPaid}
        collectionId={collectionId}
      />

      <EditCommissionModal
        visible={isCommissionModalVisible}
        onClose={() => setIsCommissionModalVisible(false)}
        onSave={onRefresh}
        cardId={card?.id}
        totalCC={totalCC}
        currentPercent={commissionPercent}
      />
    </ScrollView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  row: { flexDirection: 'row', width: '100%' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    ...Shadows.neumorphic(isDark)},
  cardClickable: {
    borderColor: colors.accent + '40',
    backgroundColor: colors.surfaceRaised},
  cardSmall: { padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginLeft: 10, textTransform: 'uppercase' },
  cardContent: {},
  cardValue: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  cardValueSmall: { fontSize: 16 },
  cardSubLabel: { fontSize: 10, marginTop: 4, fontWeight: '500', lineHeight: 14 },

  addPaymentBtn: {
    marginTop: 10,
    backgroundColor: colors.accent,
    height: 50,
    borderRadius: 14},

  paymentsSection: { marginTop: 30 },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border},
  paymentIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.success + '15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  paymentMethod: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  paymentDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  paymentDate: { fontSize: 11, color: colors.textMuted },
  paymentAmount: { fontSize: 15, fontWeight: '800', color: colors.success },
  emptyPayments: { alignItems: 'center', padding: 20, opacity: 0.5 },
  emptyText: { color: colors.textMuted, fontSize: 13 },
  
  paymentItemCancelled: {
    borderColor: colors.danger + '20',
    opacity: 0.8},
  paymentTextCancelled: {
    textDecorationLine: 'line-through',
    color: colors.danger},
  cancelledBadge: {
    backgroundColor: colors.danger + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8},
  cancelledBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.danger}
});
