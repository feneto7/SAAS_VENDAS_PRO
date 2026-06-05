import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  FlatList, TextInput, ActivityIndicator, SafeAreaView, Platform
} from 'react-native';
import { X, Search, Package, Plus } from 'lucide-react-native';
import { db } from '../../../services/database';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useTheme } from '../../../stores/useThemeStore';
import { formatCentsToBRL } from '../../../utils/money';
import { CreateProductModal } from './CreateProductModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface InventoryItem {
  id: string;
  name: string;
  price_cc: number;
  stock: number;
}

export const SellerInventoryModal = ({ visible, onClose }: Props) => {
  const { colors, isDark } = useTheme();
  const user = useAuthStore(state => state.user);
  
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateVisible, setIsCreateVisible] = useState(false);

  useEffect(() => {
    if (visible && user?.id) {
      loadInventory();
    } else if (!visible) {
      setSearch('');
    }
  }, [visible, user?.id]);

  const loadInventory = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await db.getAllAsync(`
        SELECT 
          MAX(p.id) as id, 
          p.name, 
          p.price_cc, 
          MAX(COALESCE(si.stock, 0)) as stock
        FROM products p
        LEFT JOIN seller_inventory si ON si.product_id = p.id AND si.seller_id = ?
        WHERE p.active = 1
        GROUP BY p.name, p.price_cc
        ORDER BY p.name ASC
      `, [user.id]);
      
      setItems(result as InventoryItem[]);
    } catch (e) {
      console.error('Erro ao carregar estoque:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <View style={[styles.itemContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
      </View>
      <View style={styles.itemFooter}>
        <Text style={[styles.itemPrice, { color: colors.accent }]}>
          {formatCentsToBRL(item.price_cc || 0)}
        </Text>
        <View style={styles.stockBadge}>
          <Package size={14} color={colors.textSecondary} />
          <Text style={[styles.stockText, { color: colors.textSecondary }]}>
            Estoque: {item.stock}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
        <SafeAreaView style={[styles.modalOverlay, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Meu Estoque</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surface }]} activeOpacity={0.7}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <Search size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              placeholder="Buscar produto..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textInput }]}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Package size={48} color={colors.border} />
                  <Text style={[styles.emptyText, { color: colors.textPrimary }]}>Nenhum produto encontrado.</Text>
                </View>
              }
            />
          )}

          <TouchableOpacity 
            style={[styles.fab, { backgroundColor: colors.accent }]} 
            activeOpacity={0.8}
            onPress={() => setIsCreateVisible(true)}
          >
            <Plus size={28} color="#fff" />
          </TouchableOpacity>

          <CreateProductModal
            visible={isCreateVisible}
            onClose={() => setIsCreateVisible(false)}
            onSuccess={() => {
              setIsCreateVisible(false);
              loadInventory();
            }}
          />
        </SafeAreaView>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 52,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  itemContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
