import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { 
  User, 
  MapPin, 
  FileText, 
  ChevronRight,
  DollarSign,
  Plus
} from 'lucide-react-native';
// Build version: 2026-04-12 13:48
import { useTenant } from '@/lib/TenantContext';
import { formatCurrencyBRL } from '@/lib/utils/money';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useThemeColor } from '@/components/Themed';
import { queryAll, queryFirst } from '@/lib/db';
import { SyncService } from '@/lib/sync/syncService';

dayjs.locale('pt-br');

interface Card {
  id: string;
  code: number;
  status: string;
  total: number;
  saleDate: string;
  sellerName?: string;
}

export default function ClientDetailScreen() {
  const { 
    id: clientId, 
    clientName: initialClientName, 
    routeName: initialRouteName,
    tab: initialTab
  } = useLocalSearchParams();
  const { tenantSlug, activeTrip, seller } = useTenant();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState((initialTab as string) || 'pendentes');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const infoColor = useThemeColor({}, 'primary');
  const iconColor = useThemeColor({}, 'icon');

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      
      // 1. Try local data first
      const client = await queryFirst<any>('SELECT c.*, r.name as routeName FROM clients c LEFT JOIN routes r ON c.route_id = r.id WHERE c.id = ?', [clientId]);
      const clientFichas = await queryAll<any>('SELECT * FROM fichas WHERE client_id = ? ORDER BY sale_date DESC', [clientId]);
      
      if (client) {
        setData({
          client,
          fichas: clientFichas.map(f => ({
            ...f,
            code: f.code || 'NOVO',
            saleDate: f.sale_date,
            sellerName: seller?.name // Local best guess
          }))
        });
        setLoading(false);
      }

      // 2. Background sync
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/clients/${clientId}/details`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      // Silence background refresh errors when offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchClientDetails();
    }, [clientId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchClientDetails();
  };

  const cards = data?.fichas || [];
  const stats = data?.stats || { totalSold: 0, totalPaid: 0, totalPending: 0, totalRemaining: 0 };
  const counts = data?.counts || { novas: 0, pendentes: 0, pagas: 0, pedidos: 0 };

  const filteredCards = cards.filter((f: any) => {
    if (activeTab === 'pendentes') return f.status === 'pendente' || f.status === 'link_gerado';
    if (activeTab === 'novas') return f.status === 'nova';
    if (activeTab === 'pagas') return f.status === 'paga';
    if (activeTab === 'pedidos') return f.status === 'pedido';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Sub-Header */}
      <View style={[styles.subHeader, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <View style={styles.routeBox}>
          <MapPin size={14} color={primaryColor} />
          <Text style={[styles.routeText, { color: primaryColor }]} numberOfLines={1}>
            {data?.client?.routeName || initialRouteName || 'Rota'}
          </Text>
        </View>
        <View style={styles.clientBox}>
          <User size={14} color={primaryColor} />
          <Text style={[styles.clientText, { color: textColor }]} numberOfLines={1}>
            {data?.client?.name || initialClientName || 'Cliente'}
          </Text>
        </View>
      </View>

      {/* Stats Quick View (Optional but premium) */}
      {!loading && (
        <View style={[styles.statsContainer, { borderBottomColor: borderColor }]}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
              <StatItem label="Em Aberto" value={formatCurrencyBRL(stats.totalPending)} color={infoColor} />
              <StatItem label="Vendido" value={formatCurrencyBRL(stats.totalSold)} color={primaryColor} />
              <StatItem label="Pago" value={formatCurrencyBRL(stats.totalPaid)} color={successColor} />
              <StatItem label="Restante" value={formatCurrencyBRL(stats.totalRemaining)} color={errorColor} />
           </ScrollView>
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: borderColor }]}>
        <TabButton 
          label="Pendentes" 
          active={activeTab === 'pendentes'} 
          count={counts.pendentes + (counts.link_gerado || 0)} 
          onPress={() => setActiveTab('pendentes')} 
        />
        <TabButton 
          label="Novas" 
          active={activeTab === 'novas'} 
          count={counts.novas} 
          onPress={() => setActiveTab('novas')} 
        />
        <TabButton 
          label="Pagas" 
          active={activeTab === 'pagas'} 
          count={counts.pagas} 
          onPress={() => setActiveTab('pagas')} 
        />
        <TabButton 
          label="Pedidos" 
          active={activeTab === 'pedidos'} 
          count={counts.pedidos} 
          onPress={() => setActiveTab('pedidos')} 
        />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={[styles.loadingText, { color: placeholderColor }]}>Buscando fichas...</Text>
          </View>
        ) : filteredCards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color={borderColor} />
            <Text style={[styles.emptyText, { color: secondaryColor }]}>Nenhuma ficha encontrada</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredCards.map((card: Card) => (
              <TouchableOpacity 
                key={card.id} 
                style={[styles.card, { backgroundColor: cardColor, borderColor }]}
                onPress={() => {
                  if (card.status === 'pedido') {
                    router.push({
                      pathname: `/(main)/order-detail/${card.id}`,
                      params: { clientName: initialClientName, code: card.code }
                    } as any);
                  } else {
                    router.push({
                      pathname: `/(main)/card-detail/${card.id}`,
                      params: { 
                        clientId: clientId,
                        clientName: initialClientName,
                        routeName: initialRouteName,
                      }
                    } as any);
                  }
                }}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.cardLabel, { color: placeholderColor }]}>FICHA</Text>
                    <Text style={[styles.cardCode, { color: textColor }]}>#{String(card.code).padStart(4, '0')}</Text>
                  </View>
                  <View style={styles.cardValueContainer}>
                    <Text style={[styles.cardTotal, { color: textColor }]}>{formatCurrencyBRL(card.total)}</Text>
                    <ChevronRight size={20} color={borderColor} />
                  </View>
                </View>
                <View style={[styles.cardFooter, { borderTopColor: borderColor }]}>
                  <Text style={[styles.cardDate, { color: secondaryColor }]}>
                    {card.saleDate ? dayjs(card.saleDate).format("DD/MM/YYYY HH:mm[h]") : '---'}
                  </Text>
                  {card.sellerName && (
                    <Text style={[styles.cardSeller, { color: primaryColor }]}>{card.sellerName}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Button (only in Novas) */}
      {activeTab === 'novas' && (
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: primaryColor, shadowColor: primaryColor }]} 
          activeOpacity={0.8}
          onPress={() => router.push({
            pathname: `/(main)/new-card/${clientId}`,
            params: { 
              clientName: initialClientName,
              routeName: initialRouteName,
            }
          } as any)}
        >
          <Plus size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatItem({ label, value, color }: any) {
  const surfaceColor = useThemeColor({}, 'surface');
  return (
    <View style={[styles.statItem, { backgroundColor: surfaceColor, borderColor: color + '33' }]}>
      <Text style={[styles.statLabel, { color: '#9CA3AF' }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function TabButton({ label, active, count, onPress }: any) {
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const secondaryColor = useThemeColor({}, 'secondary');
  const errorColor = useThemeColor({}, 'error');

  return (
    <TouchableOpacity 
      style={[styles.tabButton, active && { backgroundColor: primaryColor + '08' }]} 
      onPress={onPress}
    >
      <Text style={[styles.tabText, { color: active ? textColor : secondaryColor }]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: errorColor }]}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
      {active && <View style={[styles.activeIndicator, { backgroundColor: primaryColor }]} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  clientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  clientText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statItem: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 140,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
  },
  tabText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  activeTabText: {
    color: '#FFF',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#A78BFA',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  list: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    color: '#4B5563',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardCode: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  cardValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTotal: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  cardDate: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '600',
  },
  cardSeller: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0F1117',
    borderRadius: 32,
    maxHeight: '80%',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  orderList: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  orderItemName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  orderItemMeta: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  orderItemTotal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  modalFooter: {
    marginTop: 20,
    gap: 16,
  },
  modalTotalBox: {
    alignItems: 'center',
  },
  modalTotalLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalTotalValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  generateBtn: {
    backgroundColor: '#A78BFA',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '900',
  }
});
