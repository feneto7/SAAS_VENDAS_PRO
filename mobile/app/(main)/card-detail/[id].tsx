import React from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
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
import { useThemeColor } from '@/components/Themed';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams();
  const hook = useCardDetail(id as string);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const infoColor = useThemeColor({}, 'primary');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');

  if (hook.loading) {
    return (
      <DefaultView style={[styles.container, styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </DefaultView>
    );
  }

  return (
    <DefaultView style={[styles.container, { backgroundColor }]}>
      {/* HEADER */}
      <DefaultView style={[styles.header, { backgroundColor: cardColor }]}>
        <DefaultView style={styles.headerInfo}>
          <DefaultView>
            <DefaultView style={{ flexDirection: 'row', alignItems: 'center' }}>
              <DefaultText style={[styles.headerLabel, { color: placeholderColor }]}> FICHA</DefaultText>
              {hook.card?.status && (
                <DefaultView style={[
                  styles.statusBadge, 
                  hook.card.status === 'paga' && { backgroundColor: successColor },
                  hook.card.status === 'pendente' && { backgroundColor: warningColor },
                  hook.card.status === 'nova' && { backgroundColor: infoColor }
                ]}>
                  <DefaultText style={styles.statusBadgeText}>{hook.card.status.toUpperCase()}</DefaultText>
                </DefaultView>
              )}
            </DefaultView>
            <DefaultText style={[styles.fichaCode, { color: textColor }]}>{hook.card?.code}</DefaultText>
          </DefaultView>
          <DefaultView style={{ alignItems: 'flex-end' }}>
            <DefaultText style={[styles.headerLabel, { color: placeholderColor }]}>CLIENTE</DefaultText>
            <DefaultText style={[styles.clientName, { color: primaryColor }]}>{hook.card?.clientName || hook.card?.client?.name}</DefaultText>
          </DefaultView>
        </DefaultView>
      </DefaultView>

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
      <DefaultView style={[styles.tabBar, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
        <TabButton 
          label="Produtos"
          icon={<Package size={18} color={hook.activeTab === 'produtos' ? primaryColor : secondaryColor} />}
          active={hook.activeTab === 'produtos'}
          onPress={() => hook.setActiveTab('produtos')}
        />
        <TabButton 
          label="Fechamento"
          icon={<Calculator size={18} color={hook.activeTab === 'fechamento' ? primaryColor : secondaryColor} />}
          active={hook.activeTab === 'fechamento'}
          onPress={() => hook.setActiveTab('fechamento')}
        />
      </DefaultView>

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
          style={[styles.fab, { backgroundColor: primaryColor, shadowColor: primaryColor }]} 
          activeOpacity={0.8}
          onPress={() => hook.setAddProductModalVisible(true)}
        >
          <Plus size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </DefaultView>
  );
}

function TabButton({ label, icon, active, onPress }: any) {
  const primaryColor = useThemeColor({}, 'primary');
  return (
    <TouchableOpacity 
      style={[styles.tab, active && { borderTopColor: primaryColor, borderTopWidth: 2 }]}
      onPress={onPress}
    >
      {icon}
      <DefaultText style={[styles.tabLabel, { color: active ? primaryColor : '#6B7280' }]}>{label}</DefaultText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '900', marginBottom: 2 },
  fichaCode: { fontSize: 18, fontWeight: '900' },
  clientName: { fontSize: 16, fontWeight: '700' },
  statusBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  content: { flex: 1, padding: 24 },
  tabBar: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tab: { flex: 1, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  tabLabel: { fontSize: 14, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 30,
    bottom: 100,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
});
