import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, StatusBar, Alert 
} from 'react-native';
import { Plus, ChevronLeft, Package } from 'lucide-react-native';
import { ProductEditModal } from './components/ProductEditModal';
import { AddProductModal } from './components/AddProductModal';
import { ProductsTab } from './components/ProductsTab';
import { SettlementTab } from './components/SettlementTab';
import { Colors, GlobalStyles, Shadows } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useCardItemsData, CardItem } from './hooks/useCardItemsData';
import { formatCentsToBRL } from '../../utils/money';

export const CardDetailScreen = () => {
  const { goBack, currentParams } = useNavigationStore();
  const { cardId, status: cardStatus, code, total, clientName } = currentParams || {};
  
  const { items, payments, methods, ficha, loading, reload } = useCardItemsData(cardId);
  const [activeTab, setActiveTab] = useState<'products' | 'settlement'>('products');
  
  // Use live data from hook, fallback to params
  const displayCode = ficha?.code || code;
  const displayStatus = ficha?.status || cardStatus;
  const displayTotal = (ficha?.total !== undefined) ? ficha.total : (total || 0);
  const displayClientName = ficha?.clientName || clientName;
  
  // Modal states
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

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
    setEditingItem({
      card_id: cardId,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      price: product.price_cc,
      type: 'CC',
      subtotal: product.price_cc,
      isNew: true
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
    Alert.alert('Info', 'Funcionalidade de exclusão em breve.');
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

        {/* Client Info Bar */}
        <View style={styles.clientBar}>
          <View style={styles.clientIcon}>
            <Package color={Colors.primary} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientLabel}>Cliente</Text>
            <Text style={styles.clientValue} numberOfLines={1}>{displayClientName || '---'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.clientLabel}>Total</Text>
            <Text style={styles.clientTotal}>{formatCentsToBRL(displayTotal)}</Text>
          </View>
        </View>

        {/* Custom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'products' && styles.tabActive]}
            onPress={() => setActiveTab('products')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Produtos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'settlement' && styles.tabActive]}
            onPress={() => setActiveTab('settlement')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'settlement' && styles.tabTextActive]}>Fechamento</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'products' ? (
            <ProductsTab 
              items={items} 
              loading={loading} 
              onItemPress={handleItemPress} 
            />
          ) : (
            <SettlementTab 
              items={items} 
              payments={payments}
              methods={methods}
              ficha={ficha} 
              onRefresh={reload}
            />
          )}
        </View>
      </View>

      {/* FAB - Só visível na aba de produtos de fichas "nova" */}
      {displayStatus === 'nova' && activeTab === 'products' && (
        <TouchableOpacity 
          style={styles.fab} 
          activeOpacity={0.8}
          onPress={() => setIsAddModalVisible(true)}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { alignItems: 'center', flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '900', color: Colors.white },

  clientBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  clientIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clientLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  clientValue: { fontSize: 15, fontWeight: '800', color: Colors.white },
  clientTotal: { fontSize: 16, fontWeight: '900', color: Colors.primary },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    padding: 6,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    ...Shadows.black,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: Colors.white,
  },

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
    ...Shadows.black,
    elevation: 8,
  }
});
