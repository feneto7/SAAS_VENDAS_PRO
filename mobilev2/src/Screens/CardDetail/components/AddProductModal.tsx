import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, Keyboard, TouchableWithoutFeedback 
} from 'react-native';
import { X, Search, Package, Plus } from 'lucide-react-native';
import { Colors, UI } from '../../../theme/theme';
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
              <X color={Colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Search color={Colors.textMuted} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar no meu estoque..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>

          {/* List */}
          {loading && products.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={renderProduct}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Package size={48} color={Colors.cardBorder} />
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

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  container: { 
    height: '90%', 
    backgroundColor: Colors.background, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32,
    padding: 24
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { padding: 4 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20
  },
  searchInput: { flex: 1, color: Colors.white, marginLeft: 12, fontSize: 16 },

  list: { paddingBottom: 40 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center'
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  productSku: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  priceRow: { flexDirection: 'row', gap: 12 },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceLabel: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary },
  priceValue: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  stockInfo: { 
    alignItems: 'center', 
    backgroundColor: Colors.background, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder
  },
  stockLabel: { fontSize: 9, fontWeight: '900', color: Colors.textSecondary, marginBottom: 2 },
  stockValue: { fontSize: 18, fontWeight: '900', color: Colors.white },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, opacity: 0.5 },
  emptyText: { color: Colors.white, marginTop: 16, fontSize: 14, fontWeight: '600' }
});
