import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { X } from 'lucide-react-native';

interface AddPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  payAmount: string;
  setPayAmount: (val: string) => void;
  paymentMethods: any[];
  selectedMethodId: string;
  setSelectedMethodId: (id: string) => void;
  onConfirm: () => void;
  loading: boolean;
  applyCurrencyMask: (val: string) => string;
}

export function AddPaymentModal({
  visible,
  onClose,
  payAmount,
  setPayAmount,
  paymentMethods,
  selectedMethodId,
  setSelectedMethodId,
  onConfirm,
  loading,
  applyCurrencyMask
}: AddPaymentModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lançar Pagamento</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>VALOR (R$)</Text>
            <TextInput 
              style={styles.modalInput}
              keyboardType="numeric"
              value={payAmount}
              onChangeText={(val) => setPayAmount(applyCurrencyMask(val))}
              placeholder="0,00"
              placeholderTextColor="#4B5563"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FORMA DE PAGAMENTO</Text>
            <View style={styles.methodsGrid}>
               {paymentMethods.map(m => (
                 <TouchableOpacity 
                   key={m.id} 
                   style={[styles.methodBtn, selectedMethodId === m.id && styles.selectedMethod]}
                   onPress={() => setSelectedMethodId(m.id)}
                 >
                   <Text style={[styles.methodText, selectedMethodId === m.id && styles.selectedMethodText]}>
                     {m.name}
                   </Text>
                 </TouchableOpacity>
               ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.confirmBtn, { backgroundColor: '#10B981' }]} 
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.confirmBtnText}>LANÇAR</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#0F1117', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.2)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#4B5563', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  modalInput: { backgroundColor: '#1F2937', height: 56, borderRadius: 16, color: '#FFF', fontSize: 24, fontWeight: '900', paddingHorizontal: 20 },
  confirmBtn: { backgroundColor: '#FFF', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'transparent' },
  selectedMethod: { borderColor: '#A78BFA', backgroundColor: 'rgba(167, 139, 250, 0.1)' },
  methodText: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
  selectedMethodText: { color: '#A78BFA' },
});
