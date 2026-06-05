import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  TextInput, SafeAreaView, Platform, Alert, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { X, Info, DollarSign, Package } from 'lucide-react-native';
import { useTheme } from '../../../stores/useThemeStore';
import { db } from '../../../services/database';
import { SyncService } from '../../../services/syncService';
import * as Crypto from 'expo-crypto';
import { formatCentsToBRL } from '../../../utils/money';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const generateSKU = () => {
  const chars = '0123456789ABCDEF';
  let hash = '';
  for(let i=0; i<6; i++) hash += chars[Math.floor(Math.random() * chars.length)];
  return `PRD-${hash}`;
};

export const CreateProductModal = ({ visible, onClose, onSuccess }: Props) => {
  const { colors } = useTheme();
  
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [stockDeposit, setStockDeposit] = useState('');
  
  const [costPrice, setCostPrice] = useState('');
  const [priceCC, setPriceCC] = useState('');
  const [priceSC, setPriceSC] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSku(generateSKU());
      setName('');
      setCategory('');
      setBrand('');
      setStockDeposit('');
      setCostPrice('');
      setPriceCC('');
      setPriceSC('');
    }
  }, [visible]);

  if (!visible) return null;

  const parseMoney = (val: string) => {
    const numericString = val.replace(/\D/g, '');
    const cents = parseInt(numericString, 10);
    return isNaN(cents) ? 0 : cents;
  };

  const handleMoneyChange = (val: string, setter: (v: string) => void) => {
    const numericString = val.replace(/\D/g, '');
    if (!numericString) {
      setter('');
      return;
    }
    const cents = parseInt(numericString, 10);
    setter(formatCentsToBRL(cents));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome do produto é obrigatório.');
      return;
    }

    const valCost = parseMoney(costPrice);
    const valCC = parseMoney(priceCC);
    const valSC = parseMoney(priceSC);

    setLoading(true);
    try {
      const existing = await db.getAllAsync(`SELECT id FROM products WHERE LOWER(name) = ?`, [name.trim().toLowerCase()]);
      if (existing && existing.length > 0) {
        setLoading(false);
        Alert.alert('Erro', 'Já existe um produto cadastrado com essa descrição.');
        return;
      }

      const id = Crypto.randomUUID();
      
      // Salva no SQLite local os campos que o app usa
      await db.runAsync(
        `INSERT INTO products (id, name, sku, price_cc, price_sc, active) VALUES (?, ?, ?, ?, ?, 1)`,
        [id, name.trim(), sku, valCC, valSC]
      );

      // Opcional: Para o app mostrar o estoque na hora de quem criou (vendedor),
      // podemos jogar o stockDeposit como estoque do vendedor no SQLite se quisermos, 
      // mas como o web envia pro depósito central, deixaremos apenas o backend lidar, 
      // ou injetar 0 localmente para nao travar.
      // O backend vai criar o estoque de depósito.

      // Enfileira para o servidor os mesmos dados do ProductModal.tsx web
      SyncService.enqueue('POST', 'products', {
        id,
        name: name.trim(),
        sku: sku,
        category: category.trim(),
        brand: brand.trim(),
        stockDeposit: parseInt(stockDeposit) || 0,
        costPrice: valCost,
        priceCC: valCC,
        priceSC: valSC,
        active: 1
      });

      Alert.alert('Sucesso', 'Produto cadastrado com sucesso!');
      onSuccess();
    } catch (e: any) {
      Alert.alert('Erro', 'Falha ao salvar produto: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
      <SafeAreaView style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accent + '20' }]}>
                <Package size={20} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Novo Produto</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>PREENCHA AS INFORMAÇÕES DO ESTOQUE.</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surface }]} activeOpacity={0.7}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Info size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Informações Básicas</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição / Nome <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textInput }]}
                  placeholder="Ex: Arroz Tio João 5kg"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Código SKU</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textInput, opacity: 0.6 }]}
                    value={sku}
                    editable={false}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Estoque</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textInput }]}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={stockDeposit}
                    onChangeText={setStockDeposit}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textInput }]}
                    placeholder="Ex: Cereais"
                    placeholderTextColor={colors.textMuted}
                    value={category}
                    onChangeText={setCategory}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Marca</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textInput }]}
                    placeholder="Ex: Tio João"
                    placeholderTextColor={colors.textMuted}
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 16 }]}>
              <View style={styles.sectionHeader}>
                <DollarSign size={16} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Precificação</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Custo</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textInput }]}
                  placeholder="R$ 0,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={costPrice}
                  onChangeText={(val) => handleMoneyChange(val, setCostPrice)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Preço Com Comissão</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: 'rgba(168, 85, 247, 0.3)', color: colors.textInput }]}
                  placeholder="R$ 0,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={priceCC}
                  onChangeText={(val) => handleMoneyChange(val, setPriceCC)}
                />
              </View>

              <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Preço Sem Comissão</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, borderColor: 'rgba(16, 185, 129, 0.3)', color: colors.textInput }]}
                  placeholder="R$ 0,00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={priceSC}
                  onChangeText={(val) => handleMoneyChange(val, setPriceSC)}
                />
              </View>
            </View>

          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.buttonCancel, { backgroundColor: colors.surface, borderColor: colors.border }]} 
              activeOpacity={0.7}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.buttonCancelText, { color: colors.textPrimary }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.buttonSave, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]} 
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonSaveText}>{loading ? 'Salvando...' : 'Salvar Produto'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'android' ? 24 : 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    padding: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  buttonCancel: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSave: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
