import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert 
} from 'react-native';
import { X, DollarSign, Check, CreditCard } from 'lucide-react-native';
import { Colors, Shadows, UI } from '../../../theme/theme';
import { Input } from '../../../components/ui/Input';
import { PaymentMethod } from '../hooks/useCardItemsData';
import { db } from '../../../services/database';
import { SyncService } from '../../../services/syncService';
import * as Crypto from 'expo-crypto';

import { formatCentsToBRL, applyCurrencyMask, parseBRLToCents } from '../../../utils/money';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  cardId: string;
  methods: PaymentMethod[];
  remainingAmount: number;
  totalSC: number;
  status: string;
  totalPaid: number;
}

export const AddPaymentModal = ({ 
  visible, onClose, onSave, cardId, methods, 
  remainingAmount, totalSC, status, totalPaid 
}: Props) => {
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // Pre-fill with remaining amount (using mask)
      setAmount(applyCurrencyMask(remainingAmount.toString()));
      if (methods.length > 0) setSelectedMethodId(methods[0].id);
    }
  }, [visible, remainingAmount, methods]);

  const handleSave = async () => {
    if (!amount || !selectedMethodId) {
      Alert.alert('Erro', 'Por favor, informe o valor e a forma de pagamento.');
      return;
    }

    const valueCents = parseBRLToCents(amount);
    if (valueCents <= 0) {
      Alert.alert('Erro', 'Valor inválido.');
      return;
    }

    // REGRA 1: Status "nova" -> limite é o Total SC
    if (status === 'nova' && (totalPaid + valueCents) > totalSC) {
       const limit = Math.max(0, totalSC - totalPaid);
       Alert.alert(
         'Limite de Pagamento', 
         `Para fichas NOVAS, você só pode lançar pagamentos até o total de itens Sem Comissão (SC).\n\nDisponível: ${formatCentsToBRL(limit)}`
       );
       return;
    }

    // REGRA 2: Não pode exceder o saldo restante total
    if (valueCents > remainingAmount) {
       Alert.alert(
         'Valor Excedido', 
         `O valor informado (${formatCentsToBRL(valueCents)}) é maior que o saldo restante da ficha (${formatCentsToBRL(remainingAmount)}).`
       );
       return;
    }

    setLoading(true);
    try {
      const paymentId = Crypto.randomUUID();
      const paymentDate = new Date().toISOString();

      // 1. Persistir Localmente
      await db.runAsync(
        `INSERT INTO card_payments (id, card_id, method_id, amount, payment_date) VALUES (?, ?, ?, ?, ?)`,
        [paymentId, cardId, selectedMethodId, valueCents, paymentDate]
      );

      // 2. Enfileirar Sincronismo
      await SyncService.enqueue('POST_PAYMENT', 'card_payments', {
        id: paymentId,
        card_id: cardId,
        method_id: selectedMethodId,
        amount: valueCents,
        payment_date: paymentDate
      });

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to save payment:', err);
      Alert.alert('Erro', 'Não foi possível salvar o pagamento localmente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Lançar Pagamento</Text>
                <Text style={styles.subtitle}>Informe o valor recebido</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color={Colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Valor Recebido (R$)"
                placeholder="0,00"
                keyboardType="numeric"
                value={amount}
                onChangeText={(val) => setAmount(applyCurrencyMask(val))}
                icon={DollarSign}
              />

              <Text style={styles.sectionLabel}>Forma de Pagamento</Text>
              <View style={styles.methodsGrid}>
                {methods.map((m) => (
                  <TouchableOpacity 
                    key={m.id}
                    style={[
                      styles.methodItem, 
                      selectedMethodId === m.id && styles.methodSelected
                    ]}
                    onPress={() => setSelectedMethodId(m.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.methodIcon, 
                      selectedMethodId === m.id ? { backgroundColor: Colors.white } : { backgroundColor: Colors.primary + '20' }
                    ]}>
                      <CreditCard size={18} color={selectedMethodId === m.id ? Colors.primary : Colors.primary} />
                    </View>
                    <Text style={[
                      styles.methodName,
                      selectedMethodId === m.id && styles.methodNameActive
                    ]}>
                      {m.name}
                    </Text>
                    {selectedMethodId === m.id && (
                      <View style={styles.checkBadge}>
                        <Check size={10} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={[UI.button, { flex: 1, backgroundColor: Colors.success }]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Text style={UI.buttonText}>{loading ? 'Salvando...' : 'Confirmar Pagamento'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { width: '100%' },
  content: { 
    backgroundColor: Colors.cardSolid, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 24,
    maxHeight: '90%',
    ...Shadows.black,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  methodsGrid: { gap: 10, marginBottom: 30 },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
  },
  methodSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodName: { fontSize: 15, fontWeight: '600', color: Colors.white, flex: 1 },
  methodNameActive: { fontWeight: '800' },
  checkBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  
  footer: { marginTop: 20, paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
});
