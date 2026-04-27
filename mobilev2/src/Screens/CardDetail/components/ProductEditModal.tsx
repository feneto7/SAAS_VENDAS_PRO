import React, { useState, useEffect } from 'react';
import * as Crypto from 'expo-crypto';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  TextInput, KeyboardAvoidingView, Platform, 
  TouchableWithoutFeedback, Keyboard 
} from 'react-native';
import { X, Minus, Plus } from 'lucide-react-native';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Colors, UI } from '../../../theme/theme';
import { formatCentsToBRL, applyCurrencyMask, parseBRLToCents } from '../../../utils/money';
import { CardItem } from '../hooks/useCardItemsData';
import { db } from '../../../services/database';
import { CardService } from '../../../services/cardService';
import { SyncService } from '../../../services/syncService';

interface Props {
  visible: boolean;
  item: CardItem | null;
  onClose: () => void;
  onSave: () => void;
}

export const ProductEditModal = ({ visible, item, onClose, onSave }: Props) => {
  const [type, setType] = useState<'CC' | 'SC' | 'brinde'>('CC');
  const [price, setPrice] = useState('0,00');
  const [quantity, setQuantity] = useState(0);
  const [productDefaults, setProductDefaults] = useState({ priceCC: 0, priceSC: 0 });
  const [currentStock, setCurrentStock] = useState(0);

  useEffect(() => {
    if (visible && item) {
      setType(item.type);
      setPrice(applyCurrencyMask(item.price.toString()));
      setQuantity(item.quantity);
      loadProductData(item.product_id);
    }
  }, [visible, item]);

  const loadProductData = (productId: string) => {
    try {
      // Load Prices
      const pRow = db.getFirstSync<{ price_cc: number, price_sc: number }>(
        `SELECT price_cc, price_sc FROM products WHERE id = ?`,
        [productId]
      );
      if (pRow) {
        setProductDefaults({ priceCC: pRow.price_cc, priceSC: pRow.price_sc });
      }

      // Load Stock
      const sellerId = useAuthStore.getState().user?.id;
      if (sellerId) {
        const sRow = db.getFirstSync<{ stock: number }>(
          `SELECT stock FROM seller_inventory WHERE seller_id = ? AND product_id = ?`,
          [sellerId, productId]
        );
        setCurrentStock(sRow?.stock || 0);
      }
    } catch (e) {
      console.error('Error loading product data:', e);
    }
  };

  const handleTypeChange = (newType: 'CC' | 'SC' | 'brinde') => {
    setType(newType);
    if (newType === 'CC') setPrice(applyCurrencyMask(productDefaults.priceCC.toString()));
    else if (newType === 'SC') setPrice(applyCurrencyMask(productDefaults.priceSC.toString()));
    else if (newType === 'brinde') setPrice('0,00');
  };

  const handlePriceChange = (val: string) => {
    setPrice(applyCurrencyMask(val));
  };

  const handleSave = async () => {
    if (!item) return;

    const newPriceCents = parseBRLToCents(price);
    
    // Validation: Price > 0 if not brinde
    if (type !== 'brinde' && newPriceCents <= 0) {
      alert('O preço unitário deve ser maior que zero para este tipo de venda.');
      return;
    }

    const newQuantity = quantity;
    
    // Validation: Quantity >= 1
    if (newQuantity < 1) {
      alert('A quantidade mínima é 1.');
      return;
    }

    const newSubtotal = newPriceCents * newQuantity;
    
    // For updates: initialQty - newQty. For new items: 0 - newQty
    const qtyDiff = (item.isNew ? 0 : item.quantity) - newQuantity;

    try {
      // 1. UPDATE LOCAL DB FIRST (Immediate UI response)
      db.withTransactionSync(() => {
        if (item.isNew) {
          // Generate a UUID for local tracking and server consistency
          const tempId = Crypto.randomUUID();
          db.runSync(
            `INSERT INTO card_items (id, card_id, product_id, product_name, quantity, price, type, subtotal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tempId, item.card_id, item.product_id, item.product_name, newQuantity, newPriceCents, type, newSubtotal]
          );
          
          // Add to sync queue for POST
          SyncService.enqueue('POST_ITEM', 'card_items', {
            id: tempId,
            card_id: item.card_id,
            product_id: item.product_id,
            quantity: newQuantity,
            price: newPriceCents,
            type: type,
            subtotal: newSubtotal
          });
        } else {
          // Update Existing
          db.runSync(
            `UPDATE card_items SET type = ?, price = ?, quantity = ?, subtotal = ? WHERE id = ?`,
            [type, newPriceCents, newQuantity, newSubtotal, item.id]
          );

          // Add to sync queue for PATCH
          SyncService.enqueue('PATCH_ITEM', 'card_items', {
            id: item.id,
            payload: {
              quantity: newQuantity,
              unitPrice: newPriceCents,
              subtotal: newSubtotal,
              commissionType: type
            }
          });
        }

        // Update Inventory (Stock) - common for both flows
        const sellerId = useAuthStore.getState().user?.id;
        if (sellerId) {
          db.runSync(
            `UPDATE seller_inventory SET stock = stock + ? WHERE product_id = ? AND seller_id = ?`,
            [qtyDiff, item.product_id, sellerId]
          );
        }

        // 2. Global Recalculation (Shared Truth)
        // Important: this updates the 'cards' table so the header/list reflects new totals
        CardService.syncLocalTotal(item.card_id);
      });

      // 3. Close Modal & Trigger Parent Refresh (which will read from local DB first)
      onSave();
    } catch (e: any) {
      console.error('Error saving item changes:', e);
      alert('Erro local ao salvar: ' + e.message);
    }
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalContainer}
            >
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <View>
                    <Text style={styles.title}>Editar Produto</Text>
                    <Text style={styles.subtitle}>{item.product_name}</Text>
                  </View>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X color={Colors.textSecondary} size={24} />
                  </TouchableOpacity>
                </View>

                {/* Type Selector */}
                <View style={styles.section}>
                  <Text style={styles.label}>Tipo de Venda</Text>
                  <View style={styles.typeRow}>
                    <TouchableOpacity 
                      style={[styles.typeOption, type === 'CC' && styles.typeActive]}
                      onPress={() => handleTypeChange('CC')}
                    >
                      <Text style={[styles.typeText, type === 'CC' && styles.typeTextActive]}>CC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.typeOption, type === 'SC' && styles.typeActive]}
                      onPress={() => handleTypeChange('SC')}
                    >
                      <Text style={[styles.typeText, type === 'SC' && styles.typeTextActive]}>SC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.typeOption, type === 'brinde' && styles.typeActive]}
                      onPress={() => handleTypeChange('brinde')}
                    >
                      <Text style={[styles.typeText, type === 'brinde' && styles.typeTextActive]}>Brinde</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* State to calculate live stock display */}
                {(() => {
                  const initialQty = item.quantity || 0;
                  const liveStock = currentStock + (initialQty - quantity);

                  return (
                    <>
                      {/* Price Input */}
                      <View style={styles.section}>
                        <Text style={styles.label}>Preço Unitário</Text>
                        <TextInput
                          style={[UI.input, type === 'brinde' && { opacity: 0.5 }]}
                          value={price}
                          onChangeText={handlePriceChange}
                          keyboardType="numeric"
                          placeholder="0,00"
                          placeholderTextColor={Colors.textMuted}
                          editable={type !== 'brinde'}
                        />
                      </View>

                      {/* Quantity Selector */}
                      <View style={styles.section}>
                        <View style={styles.labelRow}>
                          <Text style={styles.label}>Quantidade</Text>
                          <Text style={styles.stockLabel}>
                            Estoque: <Text style={{ color: Colors.white }}>{liveStock}</Text>
                          </Text>
                        </View>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            <Minus color={Colors.white} size={24} />
                          </TouchableOpacity>
                          <View style={styles.qtyDisplay}>
                            <Text style={styles.qtyValue}>{quantity}</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={() => setQuantity(quantity + 1)}
                          >
                            <Plus color={Colors.white} size={24} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  );
                })()}

                {/* Footer / Total */}
                <View style={styles.footer}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalValue}>
                      {formatCentsToBRL(parseBRLToCents(price) * quantity)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={UI.buttonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 20 },
  modalContainer: { width: '100%' },
  content: { backgroundColor: Colors.cardBg, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.cardBorder },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.white },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  closeBtn: { padding: 4 },

  section: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  stockLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  
  typeRow: { flexDirection: 'row', gap: 8 },
  typeOption: { flex: 1, height: 40, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  typeActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typeText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  typeTextActive: { color: Colors.white },
  
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyDisplay: { flex: 1, height: 56, backgroundColor: Colors.background, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 22, fontWeight: '900', color: Colors.white },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  totalLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
  totalValue: { fontSize: 24, fontWeight: '900', color: Colors.white },
  saveBtn: { 
    ...UI.button, 
    paddingHorizontal: 32, 
    minWidth: 120 
  },
});
