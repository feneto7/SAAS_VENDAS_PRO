import React from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeColor } from '../Themed';

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
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');
  const successColor = useThemeColor({}, 'success');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <DefaultView style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior="padding" style={[styles.modalContent, { backgroundColor: cardColor, borderColor }]}>
          <DefaultView style={styles.modalHeader}>
            <DefaultText style={[styles.modalTitle, { color: textColor }]}>Lançar Pagamento</DefaultText>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={iconColor} />
            </TouchableOpacity>
          </DefaultView>

          <DefaultView style={styles.inputGroup}>
            <DefaultText style={[styles.inputLabel, { color: placeholderColor }]}>VALOR (R$)</DefaultText>
            <TextInput 
              style={[styles.modalInput, { backgroundColor: surfaceColor, color: textColor }]}
              keyboardType="numeric"
              value={payAmount}
              onChangeText={(val) => setPayAmount(applyCurrencyMask(val))}
              placeholder="0,00"
              placeholderTextColor={placeholderColor}
            />
          </DefaultView>

          <DefaultView style={styles.inputGroup}>
            <DefaultText style={[styles.inputLabel, { color: placeholderColor }]}>FORMA DE PAGAMENTO</DefaultText>
            <DefaultView style={styles.methodsGrid}>
               {paymentMethods.map(m => (
                 <TouchableOpacity 
                   key={m.id} 
                   style={[
                     styles.methodBtn, 
                     { backgroundColor: surfaceColor },
                     selectedMethodId === m.id && { borderColor: primaryColor, backgroundColor: primaryColor + '10' }
                   ]}
                   onPress={() => setSelectedMethodId(m.id)}
                 >
                   <DefaultText style={[
                     styles.methodText, 
                     { color: iconColor },
                     selectedMethodId === m.id && { color: primaryColor }
                   ]}>
                     {m.name}
                   </DefaultText>
                 </TouchableOpacity>
               ))}
            </DefaultView>
          </DefaultView>

          <TouchableOpacity 
            style={[styles.confirmBtn, { backgroundColor: successColor }]} 
            onPress={onConfirm}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <DefaultText style={styles.confirmBtnText}>LANÇAR</DefaultText>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </DefaultView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: 24, padding: 24, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  modalInput: { height: 56, borderRadius: 16, fontSize: 24, fontWeight: '900', paddingHorizontal: 20 },
  confirmBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  methodsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  methodText: { fontSize: 12, fontWeight: '700' },
});
