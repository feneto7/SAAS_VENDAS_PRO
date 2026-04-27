import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  ActivityIndicator, SafeAreaView, StatusBar 
} from 'react-native';
import { Colors, GlobalStyles, UI } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  ChevronLeft, FileText, ShoppingBag, 
  Clock, CheckCircle2 
} from 'lucide-react-native';

import { NewTab } from './components/NewTab';
import { PendingTab } from './components/PendingTab';
import { PaidTab } from './components/PaidTab';
import { OrdersTab } from './components/OrdersTab';

type TabType = 'nova' | 'pendente' | 'paga' | 'pedido';

export const CustomerDetailScreen = () => {
  const { goBack, currentParams } = useNavigationStore();
  const { clientId, clientName, routeId } = currentParams || {};

  const [activeTab, setActiveTab] = useState<TabType>('nova');

  const tabs = [
    { id: 'nova', label: 'Nova', icon: FileText },
    { id: 'pendente', label: 'Pendente', icon: Clock },
    { id: 'paga', label: 'Pagas', icon: CheckCircle2 },
    { id: 'pedido', label: 'Pedidos', icon: ShoppingBag },
  ];

  const renderActiveTab = () => {
    if (!clientId) return null;

    switch (activeTab) {
      case 'nova': return <NewTab clientId={clientId} clientName={clientName} routeId={routeId} />;
      case 'pendente': return <PendingTab clientId={clientId} clientName={clientName} />;
      case 'paga': return <PaidTab clientId={clientId} clientName={clientName} />;
      case 'pedido': return <OrdersTab clientId={clientId} clientName={clientName} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} pointerEvents="none" />
      <View style={GlobalStyles.glowBottom} pointerEvents="none" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={Colors.white} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title} numberOfLines={1}>{clientName || 'Cliente'}</Text>
            <Text style={styles.subtitle}>Histórico e Detalhes</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(tab.id as TabType)}
              >
                <tab.icon 
                  size={20} 
                  color={isActive ? Colors.white : Colors.textMuted} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {renderActiveTab()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { alignItems: 'center', flex: 1, marginHorizontal: 12 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  tabsContainer: { 
    flexDirection: 'row', 
    backgroundColor: Colors.cardBg, 
    borderRadius: 16, 
    padding: 6, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tab: { 
    flex: 1, 
    flexDirection: 'column',
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4
  },
  activeTab: { 
    backgroundColor: Colors.primary,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  activeTabLabel: { color: Colors.white },

  listContent: { paddingBottom: 40 },
  itemInfo: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemCode: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  itemDate: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTotal: { fontSize: 18, fontWeight: '900', color: Colors.white },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '900', color: Colors.white },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 60, opacity: 0.7 },
  emptyText: { color: Colors.white, fontSize: 16, fontWeight: '600', marginTop: 24 },
  emptySub: { color: Colors.textSecondary, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20, paddingHorizontal: 40 },
});
