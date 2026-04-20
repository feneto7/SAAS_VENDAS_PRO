import React, { useState, useEffect } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
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
import { useThemeColor } from '@/components/Themed';
import dayjs from 'dayjs';

export default function OrderDetailScreen() {
  const { id: orderId, clientName, code } = useLocalSearchParams();
  const { tenantSlug, activeTrip } = useTenant();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [total, setTotal] = useState(0);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');

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
    <DefaultView style={[styles.container, { backgroundColor }]}>
      {/* HEADER */}
      <DefaultView style={[styles.header, { borderBottomColor: borderColor }]}>
        <DefaultView style={{ flex: 1 }}>
          <DefaultText style={[styles.title, { color: textColor }]}>Pedido #{String(code).padStart(4, '0')}</DefaultText>
          <DefaultText style={[styles.subtitle, { color: primaryColor }]} numberOfLines={1}>{clientName || 'Cliente'}</DefaultText>
        </DefaultView>
        <DefaultView style={[styles.bagIcon, { backgroundColor: primaryColor + '10' }]}>
          <ShoppingBag size={24} color={primaryColor} />
        </DefaultView>
      </DefaultView>

      {/* ITEMS LIST */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading ? (
          <DefaultView style={styles.centerContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <DefaultText style={[styles.loadingText, { color: secondaryColor }]}>Carregando itens...</DefaultText>
          </DefaultView>
        ) : items.length === 0 ? (
          <DefaultView style={styles.emptyContainer}>
            <Package size={64} color={borderColor} />
            <DefaultText style={[styles.emptyText, { color: textColor }]}>Nenhum item encontrado</DefaultText>
          </DefaultView>
        ) : (
          items.map((item, idx) => (
            <DefaultView key={item.id || idx} style={[styles.itemCard, { backgroundColor: cardColor, borderColor }]}>
              <DefaultView style={{ flex: 1 }}>
                <DefaultText style={[styles.itemName, { color: textColor }]}>{item.name}</DefaultText>
                <DefaultView style={styles.itemMeta}>
                  <DefaultText style={[styles.itemType, { color: primaryColor }]}>
                    {item.commissionType}
                  </DefaultText>
                  <DefaultText style={[styles.itemDetails, { color: secondaryColor }]}>
                    {formatCurrencyBRL(item.unitPrice)} x {item.quantity}
                  </DefaultText>
                </DefaultView>
              </DefaultView>
              <DefaultView style={styles.itemRight}>
                <DefaultText style={[styles.itemSubtotal, { color: textColor }]}>{formatCurrencyBRL(item.subtotal)}</DefaultText>
              </DefaultView>
            </DefaultView>
          ))
        )}
      </ScrollView>

      {/* FOOTER */}
      {!loading && (
        <DefaultView style={[styles.footer, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
          <DefaultView style={styles.totalInfo}>
            <DefaultText style={[styles.totalLabel, { color: secondaryColor }]}>TOTAL DO PEDIDO</DefaultText>
            <DefaultText style={[styles.totalValue, { color: textColor }]}>{formatCurrencyBRL(total)}</DefaultText>
          </DefaultView>
          <TouchableOpacity 
            style={[styles.finalizeBtn, { backgroundColor: primaryColor }]} 
            activeOpacity={0.8}
            onPress={handleConvert}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <DefaultText style={[styles.finalizeText, { color: '#fff' }]}>GERAR FICHA</DefaultText>
                <CheckCircle2 size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </DefaultView>
      )}
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  bagIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    opacity: 0.3,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
  },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  itemName: {
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
    fontSize: 12,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  finalizeBtn: {
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  finalizeText: {
    fontSize: 14,
    fontWeight: '900',
  },
});
