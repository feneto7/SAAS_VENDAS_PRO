import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, 
  SafeAreaView, StatusBar, Alert 
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { ProductEditModal } from './components/ProductEditModal';
import { AddProductModal } from './components/AddProductModal';
import { ProductsTab } from './components/ProductsTab';
import { SettlementTab } from './components/SettlementTab';
import { SaleInformingModal } from './components/SaleInformingModal';
import { FichaHeader } from './components/FichaHeader';
import { ClientInfoBar } from './components/ClientInfoBar';

import { Colors, GlobalStyles, Shadows, UI } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useCardItemsData } from './hooks/useCardItemsData';
import { useCardDetailActions } from './hooks/useCardDetailActions';
import { styles } from './CardDetailScreen.styles';

export const CardDetailScreen = () => {
  const { goBack, currentParams } = useNavigationStore();
  const { cardId, status: cardStatus, code, total, clientName } = currentParams || {};
  
  const { items, payments, methods, ficha, stats, loading, reload } = useCardItemsData(cardId);
  const [activeTab, setActiveTab] = useState<'products' | 'settlement'>('products');
  
  // Use live data from hook/stats, fallback to params
  const displayCode = ficha?.code || code;
  const displayStatus = ficha?.status || cardStatus;
  const displayTotal = stats.totalToPay;
  const displayClientName = ficha?.clientName || clientName;
  const isFichaLocked = !!ficha?.items_locked;
  
  const {
    editingItem,
    isEditModalVisible, setIsEditModalVisible,
    isAddModalVisible, setIsAddModalVisible,
    isSaleModalVisible, setIsSaleModalVisible,
    handleItemPress,
    handleSaveSoldQty,
    handleProductSelect,
    handleCloseFicha,
  } = useCardDetailActions(cardId, displayStatus, displayTotal, isFichaLocked, items, payments, reload);

  const allItemsInformed = items.length > 0 && items.every(i => i.is_informed);

  const handleTabPress = (tab: 'products' | 'settlement') => {
    if (tab === 'settlement' && displayStatus === 'pendente' && !ficha?.items_locked) {
      Alert.alert(
        'Ação Necessária',
        'Você precisa fechar a conferência de produtos antes de acessar o financeiro.',
        allItemsInformed ? [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Fechar Ficha agora', onPress: async () => {
              const success = await handleCloseFicha();
              if (success) setActiveTab('settlement');
          }}
        ] : [
          { text: 'Entendi' }
        ]
      );
      return;
    }
    setActiveTab(tab);
  };

  const onHandleCloseFicha = async () => {
      const success = await handleCloseFicha();
      if (success) setActiveTab('settlement');
  };

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} pointerEvents="none" />
      <View style={GlobalStyles.glowBottom} pointerEvents="none" />

      <View style={styles.content}>
        <FichaHeader code={displayCode} status={displayStatus} onBack={goBack} />
        <ClientInfoBar clientName={displayClientName} total={displayTotal} />

        {/* Custom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'products' && styles.tabActive]}
            onPress={() => handleTabPress('products')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Produtos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'settlement' && styles.tabActive]}
            onPress={() => handleTabPress('settlement')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'settlement' && styles.tabTextActive]}>Fechamento</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'products' ? (
            <>
              <ProductsTab 
                items={items} 
                loading={loading} 
                cardStatus={displayStatus}
                isLocked={isFichaLocked}
                onItemPress={handleItemPress} 
              />

              {displayStatus === 'pendente' && !isFichaLocked && (
                <View style={styles.footerAction}>
                  <TouchableOpacity 
                    style={[UI.button, !allItemsInformed && styles.buttonDisabled]} 
                    activeOpacity={0.8}
                    onPress={onHandleCloseFicha}
                  >
                    <Text style={UI.buttonText}>Fechar Ficha para Conferência</Text>
                  </TouchableOpacity>
                  {!allItemsInformed && (
                    <Text style={styles.footerTip}>Preencha todos os produtos para habilitar</Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <SettlementTab 
              items={items} 
              payments={payments}
              methods={methods}
              ficha={ficha} 
              stats={stats}
              isLocked={isFichaLocked}
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

      <SaleInformingModal
        visible={isSaleModalVisible}
        item={editingItem}
        isLocked={isFichaLocked}
        onClose={() => setIsSaleModalVisible(false)}
        onSave={handleSaveSoldQty}
      />
    </SafeAreaView>
  );
};
