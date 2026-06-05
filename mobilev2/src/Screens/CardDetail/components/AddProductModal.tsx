import React, { useState, useEffect, useMemo } from 'react';
import { 
  Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import { X, Search, Package, Plus } from 'lucide-react-native';
import { getUIStyles } from '../../../theme/theme';
import { useTheme } from '../../../stores/useThemeStore';
import { db } from '../../../services/database';
import { useAuthStore } from '../../../stores/useAuthStore';
import { formatCentsToBRL } from '../../../utils/money';

interface Product {
  id: string;
  name: string;
  sku: string;
  price_cc: number;
  price_sc: number;
  stock: number;
}

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

export const AddProductModal = ({ visible, onClose, onSelect }: AddProductModalProps) => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const { colors, isDark } = useTheme();
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const loadProducts = async (query: string = '') => {
    setLoading(true);
    try {
      const sellerId = useAuthStore.getState().user?.id;
      if (!sellerId) return;

      const sql = query
        ? `SELECT p.*, si.stock 
           FROM products p 
           JOIN seller_inventory si ON p.id = si.product_id 
           WHERE si.seller_id = ? AND p.name LIKE ? AND p.active = 1
           ORDER BY p.name ASC`
        : `SELECT p.*, si.stock 
           FROM products p 
           JOIN seller_inventory si ON p.id = si.product_id 
           WHERE si.seller_id = ? AND p.active = 1
           ORDER BY p.name ASC`;
      
      const params = query ? [sellerId, `%${query}%`] : [sellerId];
      const data = await db.getAllAsync<Product>(sql, params);
      setProducts(data);
    } catch (e) {
      console.error('Failed to load inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      console.log('[DEBUG] AddProductModal became visible');
      loadProducts(search);
    }
  }, [visible, search]);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>{item.sku}</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceTag}>
            <Text style={styles.priceLabel}>CC:</Text>
            <Text style={styles.priceValue}>{formatCentsToBRL(item.price_cc)}</Text>
          </View>
          <View style={styles.priceTag}>
            <Text style={styles.priceLabel}>SC:</Text>
            <Text style={styles.priceValue}>{formatCentsToBRL(item.price_sc)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.stockInfo}>
        <Text style={styles.stockLabel}>ESTOQUE</Text>
        <Text style={styles.stockValue}>{item.stock}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar Produto</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Search color={colors.textMuted} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar no meu estoque..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>

          {/* List */}
          {loading && products.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={renderProduct}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Package size={48} color={colors.border} />
                  <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  container: { 
    height: '90%', 
    backgroundColor: colors.background, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    padding: 24
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { padding: 4 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20
  },
  searchInput: { flex: 1, color: colors.textPrimary, marginLeft: 12, fontSize: 16 },

  list: { paddingBottom: 40 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  productSku: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  priceRow: { flexDirection: 'row', gap: 12 },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceLabel: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
  priceValue: { fontSize: 13, fontWeight: '700', color: colors.accent },

  stockInfo: { 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  stockLabel: { fontSize: 9, fontWeight: '900', color: colors.textSecondary, marginBottom: 2 },
  stockValue: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { color: colors.textPrimary, marginTop: 16, fontSize: 14, fontWeight: '600' }
});
