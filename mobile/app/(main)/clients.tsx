import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
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

interface Client {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  phone: string;
  code: number;
}

export default function ClientsScreen() {
  const { tenantSlug, activeTrip } = useTenant();
  const { routeName } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/clients?routeId=${activeTrip?.routeId}&limit=500`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const data = await res.json();
      
      if (Array.isArray(data.items)) {
        setClients(data.items);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    String(c.code).includes(search)
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Clientes</Text>
        
        {/* Search Bar + Add Button */}
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Search size={18} color="rgba(255,255,255,0.3)" style={styles.searchIcon} />
            <TextInput
              placeholder="Buscar cliente..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsModalOpen(true)}
            activeOpacity={0.7}
          >
            <Plus size={24} color="#000" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <FlatList
            data={filteredClients}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.clientCard}
                onPress={() => router.push({
                  pathname: `/(main)/client-detail/${item.id}`,
                  params: { clientName: item.name, routeName }
                } as any)}
                activeOpacity={0.7}
              >
                <View style={styles.clientIconBox}>
                  <User size={20} color="#3b82f6" />
                </View>
                <View style={styles.clientInfo}>
                  <View style={styles.clientHeader}>
                    <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.clientCode}>#{String(item.code).padStart(4, '0')}</Text>
                  </View>
                  <View style={styles.clientDetails}>
                    <View style={styles.detailRow}>
                      <MapPin size={12} color="rgba(255,255,255,0.3)" style={{marginRight: 4}} />
                      <Text style={styles.detailText} numberOfLines={1}>
                        {item.neighborhood ? `${item.neighborhood}, ` : ''}{item.city}
                      </Text>
                    </View>
                    {item.phone && (
                      <View style={[styles.detailRow, {marginTop: 2}]}>
                        <Phone size={12} color="rgba(255,255,255,0.3)" style={{marginRight: 4}} />
                        <Text style={styles.detailText}>{item.phone}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color="rgba(255,255,255,0.1)" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Users size={48} color="rgba(255,255,255,0.05)" />
                <Text style={styles.emptyText}>
                  {search ? 'Nenhum cliente encontrado para sua busca.' : 'Nenhum cliente cadastrado nesta rota.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <NewClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchClients} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  addButton: {
    width: 52,
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  clientIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.1)',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  clientCode: {
    color: 'rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    opacity: 0.5,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  }
});
