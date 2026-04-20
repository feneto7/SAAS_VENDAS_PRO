import React from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView 
} from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeColor } from '../Themed';

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
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <DefaultView style={styles.modalOverlay}>
         <KeyboardAvoidingView behavior="padding" style={[styles.modalContent, { backgroundColor: cardColor, borderColor }]}>
            <DefaultView style={styles.modalHeader}>
              <DefaultText style={[styles.modalTitle, { color: textColor }]}>Acerto de Produto</DefaultText>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={iconColor} />
              </TouchableOpacity>
            </DefaultView>
            <DefaultText style={[styles.modalItemName, { color: primaryColor }]}>{selectedItem?.productName}</DefaultText>
            <DefaultText style={[styles.modalDeixado, { color: placeholderColor }]}>
              Deixado com cliente: <DefaultText style={{ color: textColor, fontWeight: 'bold' }}>{selectedItem?.quantity || 0}</DefaultText>
            </DefaultText>
            
            <DefaultView style={styles.inputGroup}>
              <DefaultText style={[styles.inputLabel, { color: iconColor }]}>QUANTIDADE VENDIDA</DefaultText>
              <TextInput 
                style={[styles.modalInput, { backgroundColor: surfaceColor, color: textColor }]}
                keyboardType="numeric"
                value={soldQty}
                onChangeText={setSoldQty}
                autoFocus
                placeholderTextColor={placeholderColor}
              />
            </DefaultView>

            <DefaultView style={styles.inputGroup}>
              <DefaultText style={[styles.inputLabel, { color: iconColor }]}>DEVOLVIDO (AUTOMÁTICO)</DefaultText>
              <DefaultText style={[styles.autoQty, { color: primaryColor }]}>
                {Math.max(0, (selectedItem?.quantity || 0) - (parseInt(soldQty) || 0))}
              </DefaultText>
            </DefaultView>

            <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: primaryColor }]} onPress={onConfirm}>
              <DefaultText style={styles.confirmBtnText}>CONFIRMAR</DefaultText>
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
  modalItemName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  modalDeixado: { fontSize: 14, marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
  modalInput: { height: 56, borderRadius: 16, fontSize: 24, fontWeight: '900', paddingHorizontal: 20 },
  autoQty: { fontSize: 28, fontWeight: '900' },
  confirmBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
