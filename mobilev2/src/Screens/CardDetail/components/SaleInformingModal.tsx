import React, { useMemo,  useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, 
  TouchableOpacity, TextInput, KeyboardAvoidingView, 
  Platform, TouchableWithoutFeedback, Keyboard 
} from 'react-native';
import { Shadows, getUIStyles } from '../../../theme/theme';
import { CardItem } from '../hooks/useCardItemsData';
import { Package, ShoppingCart, RotateCcw, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '../../../stores/useThemeStore';

interface Props {
  visible: boolean;
  item: CardItem | null;
  isLocked?: boolean;
  onClose: () => void;
  onSave: (soldQty: number) => void;
}

export const SaleInformingModal = ({ visible, item, isLocked, onClose, onSave }: Props) => {
  const { colors, isDark } = useTheme();
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors, isDark, UI), [colors, isDark, UI]);

  const [soldQty, setSoldQty] = useState('0');
  const isFichaLocked = !!isLocked;
  
  useEffect(() => {
    if (item) {
      setSoldQty(String(item.sold_quantity || 0));
    }
  }, [item, visible]);

  if (!item) return null;

  const left = item.quantity;
  const soldNum = parseInt(soldQty) || 0;
  const returned = Math.max(0, left - soldNum);

  const handleSave = () => {
    onSave(soldNum);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            <View style={styles.content}>
              <Text style={styles.title}>Informe a Venda</Text>
              <Text style={styles.productName}>{item.product_name}</Text>
              
              <View style={styles.infoRow}>
                <View style={styles.infoBox}>
                  <Package size={20} color={colors.textSecondary} />
                  <Text style={styles.infoLabel}>Deixado</Text>
                  <Text style={styles.infoValue}>{left}</Text>
                </View>
                <View style={styles.infoBox}>
                  <RotateCcw size={20} color={colors.warning} />
                  <Text style={styles.infoLabel}>Devolve</Text>
                  <Text style={[styles.infoValue, { color: colors.warning }]}>{returned}</Text>
                </View>
              </View>

              <View style={styles.qtyActionRow}>
                <TouchableOpacity 
                   style={[styles.qtyBtn, isFichaLocked && { opacity: 0.5, backgroundColor: colors.textMuted }]} 
                   disabled={isFichaLocked}
                   onPress={() => {
                     const num = parseInt(soldQty) || 0;
                     if (num > 0) setSoldQty(String(num - 1));
                   }}
                >
                  <Minus color={colors.buttonText} size={28} />
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, isFichaLocked && { color: colors.textMuted }]}
                    value={soldQty}
                    editable={!isFichaLocked}
                    onChangeText={(val) => {
                      const cleaned = val.replace(/[^0-9]/g, '');
                      const num = parseInt(cleaned) || 0;
                      if (num <= left) setSoldQty(cleaned);
                    }}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    selectTextOnFocus
                  />
                </View>

                <TouchableOpacity 
                   style={[styles.qtyBtn, isFichaLocked && { opacity: 0.5, backgroundColor: colors.textMuted }]} 
                   disabled={isFichaLocked}
                   onPress={() => {
                     const num = parseInt(soldQty) || 0;
                     if (num < left) setSoldQty(String(num + 1));
                   }}
                >
                  <Plus color={colors.buttonText} size={28} />
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity 
                  onPress={onClose}
                  style={[styles.btn, styles.cancelBtn]}
                >
                  <Text style={styles.cancelBtnText}>{isFichaLocked ? 'FECHAR' : 'CANCELAR'}</Text>
                </TouchableOpacity>
                
                {!isFichaLocked && (
                  <TouchableOpacity 
                    onPress={handleSave}
                    style={[styles.btn, styles.saveBtn]}
                  >
                    <Text style={styles.saveBtnText}>CONFIRMAR</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (colors: any, isDark: boolean, UI: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  container: { width: '100%', maxWidth: 400 },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.neumorphic(isDark)
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8
  },
  productName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  infoBox: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 8
  },
  infoValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 4
  },
  qtyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24
  },
  qtyBtn: {
    width: 64,
    height: 64,
    backgroundColor: colors.accent,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary(colors)
  },
  inputWrapper: {
    flex: 1,
    maxWidth: 100},
  input: {
    ...UI.input,
    textAlign: 'center',
    fontSize: 28,
    paddingHorizontal: 0,
    height: 64,
    borderRadius: 20},
  footer: {
    flexDirection: 'row',
    gap: 12
  },
  btn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtn: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800'
  },
  saveBtn: {
    backgroundColor: colors.accent,
    ...Shadows.primary(colors)
  },
  saveBtnText: {
    color: colors.buttonText,
    fontSize: 13,
    fontWeight: '900'
  }
});
