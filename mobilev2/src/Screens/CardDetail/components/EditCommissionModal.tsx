import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert 
} from 'react-native';
import { X, Percent, DollarSign, Check } from 'lucide-react-native';
import { Colors, Shadows, UI } from '../../../theme/theme';
import { Input } from '../../../components/ui/Input';
import { db } from '../../../services/database';
import { SyncService } from '../../../services/syncService';

import { applyCurrencyMask, parseBRLToCents } from '../../../utils/money';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  cardId: string;
  totalCC: number;
  currentPercent: number;
}

export const EditCommissionModal = ({ visible, onClose, onSave, cardId, totalCC, currentPercent }: Props) => {
  const [percent, setPercent] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setPercent(currentPercent.toString());
      const initialValueCents = Math.round(totalCC * (currentPercent / 100));
      setValue(applyCurrencyMask(initialValueCents.toString()));
    }
  }, [visible, currentPercent, totalCC]);

  const handlePercentChange = (val: string) => {
    const cleanVal = val.replace(',', '.');
    setPercent(val);
    
    const p = parseFloat(cleanVal);
    if (!isNaN(p)) {
      const calculatedValueCents = Math.round(totalCC * (p / 100));
      setValue(applyCurrencyMask(calculatedValueCents.toString()));
    }
  };

  const handleValueChange = (val: string) => {
    const masked = applyCurrencyMask(val);
    setValue(masked);
    
    const vCents = parseBRLToCents(masked);
    
    if (totalCC > 0) {
      const calculatedPercent = (vCents * 100) / totalCC;
      setPercent(calculatedPercent.toFixed(2).replace('.', ','));
    }
  };

  const handleSave = async () => {
    const finalPercent = parseFloat(percent.replace(',', '.'));
    
    if (isNaN(finalPercent) || finalPercent < 0 || finalPercent > 100) {
      Alert.alert('Erro', 'Porcentagem de comissão inválida. Deve estar entre 0 e 100.');
      return;
    }

    setLoading(true);
    try {
      // 1. Persistir Localmente
      await db.runAsync(
        `UPDATE cards SET commission_percent = ? WHERE id = ?`,
        [finalPercent, cardId]
      );

      // 2. Enfileirar Sincronismo (usa rota settle)
      await SyncService.enqueue('PATCH_FICHA_SETTLE', 'cards', {
        id: cardId,
        commissionPercent: finalPercent
      });

      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to update commission:', err);
      Alert.alert('Erro', 'Não foi possível salvar a comissão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Ajustar Comissão</Text>
                <Text style={styles.subtitle}>Margem sobre Produtos CC</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X color={Colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.baseInfo}>
                <Text style={styles.baseLabel}>Base CC (100%):</Text>
                <Text style={styles.baseValue}>{ (totalCC / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }</Text>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 15 }}>
                  <Input
                    label="Porcentagem (%)"
                    placeholder="30"
                    keyboardType="numeric"
                    value={percent}
                    onChangeText={handlePercentChange}
                    icon={Percent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Valor em R$"
                    placeholder="0,00"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={handleValueChange}
                    icon={DollarSign}
                  />
                </View>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity 
                   onPress={() => handlePercentChange('30')}
                   style={styles.presetBtn}
                >
                    <Text style={styles.presetText}>Resetar para 30%</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[UI.button, { backgroundColor: Colors.primary }]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <Text style={UI.buttonText}>Salvando...</Text>
                  ) : (
                    <>
                      <Check size={20} color={Colors.white} style={{ marginRight: 8 }} />
                      <Text style={UI.buttonText}>Confirmar Margem</Text>
                    </>
                  )}
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  container: { width: '100%' },
  content: { 
    backgroundColor: Colors.cardSolid, 
    borderRadius: 24, 
    padding: 24,
    ...Shadows.black,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  
  baseInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  baseLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  baseValue: { fontSize: 14, color: Colors.white, fontWeight: '700' },

  row: { flexDirection: 'row' },
  
  footer: { marginTop: 10 },
  presetBtn: { alignSelf: 'center', padding: 10, marginBottom: 10 },
  presetText: { color: Colors.primary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' }
});
