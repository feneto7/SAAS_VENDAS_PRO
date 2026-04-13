import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { 
  X, 
  Package, 
  Calculator, 
  Plus
} from 'lucide-react-native';
import { formatCurrencyBRL, applyCurrencyMask } from '@/lib/utils/money';
import { ProductSelectionModal } from '@/components/ProductSelectionModal';
import { useCardDetail } from '@/hooks/useCardDetail';
import { ItemSettlementModal } from '@/components/modals/ItemSettlementModal';
import { AddPaymentModal } from '@/components/modals/AddPaymentModal';
import { CardProductsTab } from '@/components/features/card/CardProductsTab';
import { CardSettlementTab } from '@/components/features/card/CardSettlementTab';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams();
  const hook = useCardDetail(id as string);

  if (hook.loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerLabel}> FICHA</Text>
              {hook.card?.status && (
                <View style={[
                  styles.statusBadge, 
                  hook.card.status === 'paga' && { backgroundColor: '#059669' },
                  hook.card.status === 'pendente' && { backgroundColor: '#D97706' },
                  hook.card.status === 'nova' && { backgroundColor: '#2563EB' }
                ]}>
                  <Text style={styles.statusBadgeText}>{hook.card.status.toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.fichaCode}>{hook.card?.code}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.headerLabel}>CLIENTE</Text>
            <Text style={styles.clientName}>{hook.card?.clientName || hook.card?.client?.name}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {hook.activeTab === 'produtos' ? (
          <CardProductsTab 
            items={hook.items}
            isPaid={hook.isPaga}
            status={hook.card?.status}
            onOpenItemModal={hook.handleOpenItemModal}
            onEditItem={(item) => {
              hook.setEditingItem(item);
              hook.setAddProductModalVisible(true);
            }}
            onDeleteItem={hook.handleDeleteItem}
            onSaveSettlement={hook.handleSaveSettlement}
            saveLoading={hook.saveLoading}
            formatCurrencyBRL={formatCurrencyBRL}
          />
        ) : (
          <CardSettlementTab 
            totals={hook.totals}
            card={hook.card}
            isPaid={hook.isPaga}
            onAddPayment={() => hook.setPaymentModalVisible(true)}
            onCancelPayment={hook.handleCancelPayment}
            formatCurrencyBRL={formatCurrencyBRL}
          />
        )}
      </ScrollView>

      {/* TABS AT BOTTOM */}
      <View style={styles.tabBar}>
        <TabButton 
          label="Produtos"
          icon={<Package size={18} color={hook.activeTab === 'produtos' ? '#A78BFA' : '#6B7280'} />}
          active={hook.activeTab === 'produtos'}
          onPress={() => hook.setActiveTab('produtos')}
        />
        <TabButton 
          label="Fechamento"
          icon={<Calculator size={18} color={hook.activeTab === 'fechamento' ? '#A78BFA' : '#6B7280'} />}
          active={hook.activeTab === 'fechamento'}
          onPress={() => hook.setActiveTab('fechamento')}
        />
      </View>

      {/* MODALS */}
      <ItemSettlementModal 
        visible={hook.itemModalVisible}
        onClose={() => hook.setItemModalVisible(false)}
        selectedItem={hook.selectedItem}
        soldQty={hook.soldQty}
        setSoldQty={hook.setSoldQty}
        onConfirm={hook.handleSaveItemQty}
      />

      <AddPaymentModal 
        visible={hook.paymentModalVisible}
        onClose={() => hook.setPaymentModalVisible(false)}
        payAmount={hook.payAmount}
        setPayAmount={hook.setPayAmount}
        paymentMethods={hook.paymentMethods}
        selectedMethodId={hook.selectedMethodId}
        setSelectedMethodId={hook.setSelectedMethodId}
        onConfirm={hook.handleAddPayment}
        loading={hook.paymentLoading}
        applyCurrencyMask={applyCurrencyMask}
      />

      <ProductSelectionModal 
        visible={hook.addProductModalVisible}
        onClose={() => {
          hook.setAddProductModalVisible(false);
          hook.setEditingItem(null);
        }}
        onAdd={hook.handleAppendItem}
        sellerId={hook.card?.sellerId}
        isAppending={true}
        initialItem={hook.editingItem}
      />

      {/* FAB for Add Product (Nova status only) */}
      {hook.card?.status === 'nova' && hook.activeTab === 'produtos' && (
        <TouchableOpacity 
          style={styles.fab} 
          activeOpacity={0.8}
          onPress={() => hook.setAddProductModalVisible(true)}
        >
          <Plus size={32} color="#000" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function TabButton({ label, icon, active, onPress }: any) {
  return (
    <TouchableOpacity 
      style={[styles.tab, active && styles.activeTab]}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  headerInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLabel: { color: '#4B5563', fontSize: 10, fontWeight: '900', marginBottom: 2 },
  fichaCode: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  clientName: { color: '#A78BFA', fontSize: 16, fontWeight: '700' },
  statusBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  content: { flex: 1, padding: 24 },
  tabBar: { 
    flexDirection: 'row', 
    backgroundColor: '#0F1117',
    borderTopWidth: 1, 
    borderTopColor: '#1F2937',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tab: { flex: 1, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  activeTab: { borderTopWidth: 2, borderTopColor: '#A78BFA' },
  tabLabel: { color: '#6B7280', fontSize: 14, fontWeight: '700' },
  activeTabLabel: { color: '#A78BFA' },
  fab: {
    position: 'absolute',
    right: 30,
    bottom: 100,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
});
