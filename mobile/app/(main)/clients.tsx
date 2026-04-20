import React, { useState, useEffect } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTenant } from '../../lib/TenantContext';
import { 
  Users, 
  Search, 
  Plus,
  User,
  MapPin,
  ChevronRight,
  Phone
} from 'lucide-react-native';
import { NewClientModal } from '../../components/modals/NewClientModal';
import { useThemeColor } from '../../components/Themed';
import { queryAll } from '../../lib/db';
import { SyncService } from '../../lib/sync/syncService';

interface Client {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  phone: string;
  code: number;
}

export default function ClientsScreen() {
  const { tenantSlug, activeTrip, seller } = useTenant();
  const { routeName } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');
  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    if (activeTrip?.routeId) {
      fetchClients();
    } else {
      setLoading(false);
      Alert.alert('Erro', 'Rota não selecionada.');
      router.back();
    }
  }, [activeTrip]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      // 1. Read from Local DB first
      const localData = await queryAll<any>(
        'SELECT * FROM clients WHERE route_id = ? AND active = 1 ORDER BY name ASC',
        [activeTrip?.routeId]
      );
      
      if (localData.length > 0) {
        setClients(localData);
        setLoading(false);
      }

      // 2. Try to sync with server in background if possible
      try {
        await SyncService.downloadMasterData(tenantSlug || '', seller?.id);
        const updatedData = await queryAll<any>(
          'SELECT * FROM clients WHERE route_id = ? AND active = 1 ORDER BY name ASC',
          [activeTrip?.routeId]
        );
        setClients(updatedData);
      } catch (err) {
        console.log('Background sync failed, using local data');
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    String(c.code).includes(search)
  );

  return (
    <DefaultView style={[styles.container, { backgroundColor }]}>
      <DefaultView style={styles.content}>
        <DefaultText style={[styles.pageTitle, { color: textColor }]}>Clientes</DefaultText>
        
        {/* Search Bar + Add Button */}
        <DefaultView style={styles.headerActions}>
          <DefaultView style={[styles.searchContainer, { backgroundColor: surfaceColor, borderColor }]}>
            <Search size={18} color={placeholderColor} style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar cliente..."
              placeholderTextColor={placeholderColor}
              style={[styles.searchInput, { color: textColor }]}
              value={search}
              onChangeText={setSearch}
            />
          </DefaultView>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: primaryColor, shadowColor: primaryColor }]}
            onPress={() => setIsModalOpen(true)}
            activeOpacity={0.7}
          >
            <Plus size={24} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </DefaultView>

        {loading ? (
          <DefaultView style={styles.center}>
            <ActivityIndicator size="large" color={primaryColor} />
          </DefaultView>
        ) : (
          <FlatList
            data={filteredClients}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.clientCard, { backgroundColor: cardColor, borderColor }]}
                onPress={() => router.push({
                  pathname: `/(main)/client-detail/[id]`,
                  params: { id: item.id, clientName: item.name, routeName }
                } as any)}
                activeOpacity={0.7}
              >
                <DefaultView style={[styles.clientIconBox, { backgroundColor: primaryColor + '10', borderColor: primaryColor + '20' }]}>
                  <User size={20} color={primaryColor} />
                </DefaultView>
                <DefaultView style={styles.clientInfo}>
                  <DefaultView style={styles.clientHeader}>
                    <DefaultText style={[styles.clientName, { color: textColor }]} numberOfLines={1}>{item.name}</DefaultText>
                    <DefaultText style={[styles.clientCode, { color: placeholderColor }]}>#{String(item.code).padStart(4, '0')}</DefaultText>
                  </DefaultView>
                  <DefaultView style={styles.clientDetails}>
                    <DefaultView style={styles.detailRow}>
                      <MapPin size={12} color={placeholderColor} style={{marginRight: 4}} />
                      <DefaultText style={[styles.detailText, { color: secondaryColor }]} numberOfLines={1}>
                        {item.neighborhood ? `${item.neighborhood}, ` : ''}{item.city}
                      </DefaultText>
                    </DefaultView>
                    {item.phone && (
                      <DefaultView style={[styles.detailRow, {marginTop: 2}]}>
                        <Phone size={12} color={placeholderColor} style={{marginRight: 4}} />
                        <DefaultText style={[styles.detailText, { color: secondaryColor }]}>{item.phone}</DefaultText>
                      </DefaultView>
                    )}
                  </DefaultView>
                </DefaultView>
                <ChevronRight size={18} color={borderColor} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <DefaultView style={styles.emptyContainer}>
                <Users size={48} color={borderColor} />
                <DefaultText style={[styles.emptyText, { color: secondaryColor }]}>
                  {search ? 'Nenhum cliente encontrado para sua busca.' : 'Nenhum cliente cadastrado nesta rota.'}
                </DefaultText>
              </DefaultView>
            }
          />
        )}
      </DefaultView>

      <NewClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchClients} 
      />
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  clientIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
  },
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  clientCode: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  clientDetails: {
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  }
});
