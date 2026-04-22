import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, StatusBar, Alert 
} from 'react-native';
import { Plus, ChevronLeft, Package, Edit2, Trash2, MoreVertical, Search, X } from 'lucide-react-native';
import { ProductEditModal } from './components/ProductEditModal';
import { AddProductModal } from './components/AddProductModal';
import { Colors, GlobalStyles, UI } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useCardItemsData, CardItem } from './hooks/useCardItemsData';
import { formatCentsToBRL } from '../../utils/money';
import { db } from '../../services/database';
import { SyncService } from '../../services/syncService';

export const CardDetailScreen = () => {
  const { goBack, currentParams } = useNavigationStore();
  const { cardId, status: cardStatus, code, total, clientName } = currentParams || {};
  
  const { items, ficha, loading, reload } = useCardItemsData(cardId);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Use live data from hook, fallback to params
  const displayCode = ficha?.code || code;
  const displayStatus = ficha?.status || cardStatus;
  const displayTotal = (ficha?.total !== undefined) ? ficha.total : (total || 0);
  const displayClientName = ficha?.clientName || clientName;
  
  // Modal states
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'CC': return { color: Colors.success, label: 'CC' };
      case 'SC': return { color: Colors.info, label: 'SC' };
      case 'brinde': return { color: Colors.warning, label: 'Brinde' };
      default: return { color: Colors.textSecondary, label: type };
    }
  };

  const handleItemPress = (item: CardItem) => {
    Alert.alert(
      'Opções do Produto',
      `${item.product_name}\nQuantidade: ${item.quantity}`,
      [
        { 
          text: 'Editar', 
          onPress: () => {
            setEditingItem(item);
            setIsEditModalVisible(true);
          } 
        },
        { text: 'Excluir', onPress: () => confirmDelete(item), style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleProductSelect = (product: any) => {
    setIsAddModalVisible(false);
    // Create a "mock" item for ProductEditModal
    // If it has NO id, ProductEditModal should know it's a NEW item
    setEditingItem({
      card_id: cardId,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price: product.price_cc, // Default to CC
      type: 'CC',
      subtotal: product.price_cc,
      isNew: true // Flag for local-first handling
    });
    setIsEditModalVisible(true);
  };

  const confirmDelete = (item: CardItem) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente remover ${item.product_name}?`,
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, Excluir', onPress: () => deleteItem(item.id), style: 'destructive' }
      ]
    );
  };

  const deleteItem = async (itemId: string) => {
    // Implementação futura da deleção (Local-First Sync)
    Alert.alert('Info', 'Funcionalidade de exclusão em breve.');
  };

  const renderProduct = ({ item }: { item: CardItem }) => {
    const { color, label } = getTypeStyle(item.type);
    
    return (
      <TouchableOpacity 
        style={UI.listItem} 
        activeOpacity={0.8}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.itemMain}>
          <View style={styles.itemHeader}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={[styles.productType, { color }]}>{label}</Text>
          </View>
          
          <View style={styles.itemFooter}>
            <View style={styles.qtyBox}>
              <Package size={14} color={Colors.textSecondary} />
              <Text style={styles.qtyText}>
                {item.quantity} un x {formatCentsToBRL(item.price || 0)}
              </Text>
            </View>
            <Text style={styles.subtotalText}>{formatCentsToBRL(item.subtotal || 0)}</Text>
          </View>
        </View>
        <MoreVertical size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} pointerEvents="none" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={Colors.white} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>Ficha #{displayCode || '---'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: displayStatus === 'nova' ? Colors.info : Colors.cardBg }]}>
              <Text style={styles.statusText}>{(displayStatus || '').toUpperCase()}</Text>
            </View>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Summary Bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{formatCentsToBRL(displayTotal)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={[styles.summaryItem, { alignItems: 'flex-end' }]}>
            <Text style={styles.summaryLabel}>Cliente</Text>
            <Text style={styles.summaryValue} numberOfLines={1}>{displayClientName || '---'}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Package size={64} color={Colors.cardBorder} />
                <Text style={styles.emptyText}>Nenhum produto nesta ficha.</Text>
                <Text style={styles.emptySub}>Adicione produtos para começar a venda.</Text>
              </View>
            }
          />
        )}
      </View>

      {/* FAB - Só visível em fichas "nova" */}
      {displayStatus === 'nova' && (
        <TouchableOpacity 
          style={styles.fab} 
          activeOpacity={0.8}
          onPress={() => {
            console.log('FAB Clicked');
            setIsAddModalVisible(true);
          }}
        >
          <Plus color={Colors.white} size={32} />
        </TouchableOpacity>
      )}

      <View style={GlobalStyles.glowBottom} pointerEvents="none" />
      
      <AddProductModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSelect={handleProductSelect}
      />

      <ProductEditModal 
        visible={isEditModalVisible}
        item={editingItem}
        onClose={() => setIsEditModalVisible(false)}
        onSave={() => {
          setIsEditModalVisible(false);
          reload();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { alignItems: 'center', flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '900', color: Colors.white },

  summaryBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.cardBorder,
    marginHorizontal: 20,
  },

  list: { paddingBottom: 40 },
  itemMain: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: '800', color: Colors.white, flex: 1 },
  productType: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  subtotalText: { fontSize: 17, fontWeight: '900', color: Colors.white },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.7 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 24 },
  emptySub: { color: Colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    zIndex: 99, // Garantir que fique por cima
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  }
});
