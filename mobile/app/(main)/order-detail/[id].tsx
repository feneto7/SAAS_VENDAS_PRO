import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ShoppingBag, 
  Package,
  CheckCircle2,
  ChevronRight
} from 'lucide-react-native';
import { useTenant } from '@/lib/TenantContext';
import { formatCurrencyBRL } from '@/lib/utils/money';
import dayjs from 'dayjs';

export default function OrderDetailScreen() {
  const { id: orderId, clientName, code } = useLocalSearchParams();
  const { tenantSlug, activeTrip } = useTenant();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchOrderItems = async () => {
    try {
      setLoading(true);
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/fichas/${orderId}/items`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        const sum = data.reduce((acc: number, i: any) => acc + (Number(i.subtotal) || 0), 0);
        setTotal(sum);
      }
    } catch (err) {
      console.error('Fetch order items failed:', err);
      Alert.alert("Erro", "Falha ao carregar itens do pedido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderItems();
  }, [orderId]);

  const handleConvert = async () => {
    try {
      setProcessing(true);
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/fichas/${orderId}/convert-order`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug || '' 
        },
        body: JSON.stringify({ cobrancaId: activeTrip?.id })
      });

      if (res.ok) {
        Alert.alert("Sucesso", "Pedido transformado em ficha nova!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        const errData = await res.json();
        Alert.alert("Erro", errData.error || "Falha ao gerar ficha");
      }
    } catch (err) {
      Alert.alert("Erro", "Problema de conexão");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Pedido #{String(code).padStart(4, '0')}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{clientName || 'Cliente'}</Text>
        </View>
        <View style={styles.bagIcon}>
          <ShoppingBag size={24} color="#A78BFA" />
        </View>
      </View>

      {/* ITEMS LIST */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <Text style={styles.loadingText}>Carregando itens...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#1F2937" />
            <Text style={styles.emptyText}>Nenhum item encontrado</Text>
          </View>
        ) : (
          items.map((item, idx) => (
            <View key={item.id || idx} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemType, { color: '#60A5FA' }]}>
                    {item.commissionType}
                  </Text>
                  <Text style={styles.itemDetails}>
                    {formatCurrencyBRL(item.unitPrice)} x {item.quantity}
                  </Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemSubtotal}>{formatCurrencyBRL(item.subtotal)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* FOOTER */}
      {!loading && (
        <View style={styles.footer}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>TOTAL DO PEDIDO</Text>
            <Text style={styles.totalValue}>{formatCurrencyBRL(total)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.finalizeBtn} 
            activeOpacity={0.8}
            onPress={handleConvert}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.finalizeText}>GERAR FICHA</Text>
                <CheckCircle2 size={20} color="#000" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  subtitle: {
    color: '#A78BFA',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  bagIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 24,
    paddingBottom: 120,
  },
  centerContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    opacity: 0.3,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  itemName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemType: {
    fontSize: 10,
    fontWeight: '900',
  },
  itemDetails: {
    color: '#6B7280',
    fontSize: 12,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemSubtotal: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0A0A0A',
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(167, 139, 250, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  finalizeBtn: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finalizeText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
});
