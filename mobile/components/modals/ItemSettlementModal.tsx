import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView 
} from 'react-native';
import { X } from 'lucide-react-native';

interface ItemSettlementModalProps {
  visible: boolean;
  onClose: () => void;
  selectedItem: any;
  soldQty: string;
  setSoldQty: (val: string) => void;
  onConfirm: () => void;
}

export function ItemSettlementModal({ 
  visible, 
  onClose, 
  selectedItem, 
  soldQty, 
  setSoldQty, 
  onConfirm 
}: ItemSettlementModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
         <KeyboardAvoidingView behavior="padding" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Acerto de Produto</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalItemName}>{selectedItem?.productName}</Text>
            <Text style={styles.modalDeixado}>Deixado com cliente: <Text style={{ color: '#FFF' }}>{selectedItem?.quantity || 0}</Text></Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>QUANTIDADE VENDIDA</Text>
              <TextInput 
                style={styles.modalInput}
                keyboardType="numeric"
                value={soldQty}
                onChangeText={setSoldQty}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DEVOLVIDO (AUTOMÁTICO)</Text>
              <Text style={styles.autoQty}>{Math.max(0, (selectedItem?.quantity || 0) - (parseInt(soldQty) || 0))}</Text>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmBtnText}>CONFIRMAR</Text>
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
  modalItemName: { color: '#A78BFA', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  modalDeixado: { color: '#6B7280', fontSize: 14, marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#4B5563', fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  modalInput: { backgroundColor: '#1F2937', height: 56, borderRadius: 16, color: '#FFF', fontSize: 24, fontWeight: '900', paddingHorizontal: 20 },
  autoQty: { color: '#A78BFA', fontSize: 28, fontWeight: '900' },
  confirmBtn: { backgroundColor: '#FFF', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
});
