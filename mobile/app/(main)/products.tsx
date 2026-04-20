import React, { useState, useEffect } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTenant } from '../../lib/TenantContext';
import { Package, Search, ChevronLeft, Tag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatCurrencyBRL } from '../../lib/utils/money';
import { useThemeColor } from '../../components/Themed';

import { queryAll } from '../../lib/db';
import { SyncService } from '../../lib/sync/syncService';

interface Product {
  id: string;
  name: string;
  sku: string;
  priceCC: number;
  priceSC: number;
  stockDeposit: number;
}

export default function ProductsScreen() {
  const { tenantSlug, seller } = useTenant();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');
  const successColor = useThemeColor({}, 'success');
  const warningColor = useThemeColor({}, 'warning');
  const errorColor = useThemeColor({}, 'error');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // 1. Read from Local DB first
      const localData = await queryAll<any>(
        'SELECT * FROM products WHERE active = 1 ORDER BY name ASC'
      );
      
      if (localData.length > 0) {
        // Map local snake_case names to camelCase for the UI
        const mapped = localData.map(p => ({
          ...p,
          priceCC: p.price_cc,
          priceSC: p.price_sc,
          stock: p.stock // Seller stock
        }));
        setProducts(mapped);
        setLoading(false);
      }

      // 2. Try to sync with server in background if possible
      try {
        await SyncService.downloadMasterData(tenantSlug || '', seller?.id);
        const updatedData = await queryAll<any>(
          'SELECT * FROM products WHERE active = 1 ORDER BY name ASC'
        );
        const mapped = updatedData.map(p => ({
          ...p,
          priceCC: p.price_cc,
          priceSC: p.price_sc,
          stock: p.stock
        }));
        setProducts(mapped);
      } catch (err) {
        console.warn('[Products] Background sync failed, using local data');
      }
    } catch (err) {
      console.warn('[Products] Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return formatCurrencyBRL(val, true);
  };

  return (
    <DefaultView style={[styles.container, { backgroundColor }]}>
      <DefaultView style={styles.content}>
        <DefaultText style={[styles.pageTitle, { color: textColor }]}>Produtos</DefaultText>
        {/* Search Bar */}
        <DefaultView style={[styles.searchContainer, { backgroundColor: surfaceColor, borderColor }]}>
          <Search size={20} color={placeholderColor} style={styles.searchIcon} />
          <TextInput
            placeholder="Nome ou SKU..."
            placeholderTextColor={placeholderColor}
            style={[styles.searchInput, { color: textColor }]}
            value={search}
            onChangeText={setSearch}
          />
        </DefaultView>

        {loading ? (
          <DefaultView style={styles.center}>
            <ActivityIndicator size="large" color={successColor} />
          </DefaultView>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }: any) => (
              <DefaultView style={[styles.productCard, { backgroundColor: cardColor, borderColor }]}>
                <LinearGradient
                  colors={[primaryColor + '08', primaryColor + '02']}
                  style={styles.productGradient}
                >
                  <DefaultView style={styles.productHeader}>
                    <DefaultView style={[styles.skuBadge, { backgroundColor: successColor + '10' }]}>
                      <Tag size={10} color={successColor} />
                      <DefaultText style={[styles.skuText, { color: successColor }]}>{item.sku}</DefaultText>
                    </DefaultView>
                    <DefaultView style={{ flexDirection: 'row', gap: 8 }}>
                      <DefaultView style={[styles.stockBadge, { backgroundColor: surfaceColor }]}>
                        <DefaultText style={[styles.stockLabel, { color: placeholderColor }]}>Estoque: </DefaultText>
                        <DefaultText style={[styles.stockValue, { color: textColor }]}>{item.stock || 0}</DefaultText>
                      </DefaultView>
                    </DefaultView>
                  </DefaultView>

                  <DefaultText style={[styles.productName, { color: textColor }]} numberOfLines={2}>{item.name}</DefaultText>
                  
                  <DefaultView style={[styles.priceRow, { backgroundColor: backgroundColor + '40' }]}>
                    <DefaultView style={styles.priceCol}>
                      <DefaultText style={[styles.priceLabel, { color: secondaryColor }]}>Preço (CC)</DefaultText>
                      <DefaultText style={[styles.priceValue, { color: textColor }]}>{formatCurrency(item.priceCC)}</DefaultText>
                    </DefaultView>
                    <DefaultView style={[styles.priceDivider, { backgroundColor: borderColor }]} />
                    <DefaultView style={styles.priceCol}>
                      <DefaultText style={[styles.priceLabel, { color: secondaryColor }]}>Preço (SC)</DefaultText>
                      <DefaultText style={[styles.priceValue, { color: warningColor }]}>
                        {formatCurrency(item.priceSC)}
                      </DefaultText>
                    </DefaultView>
                  </DefaultView>
                </LinearGradient>
              </DefaultView>
            )}
            ListEmptyComponent={
              <DefaultView style={styles.emptyContainer}>
                <Package size={48} color={borderColor} />
                <DefaultText style={[styles.emptyText, { color: secondaryColor }]}>Nenhum produto disponível.</DefaultText>
              </DefaultView>
            }
          />
        )}
      </DefaultView>
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
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  productCard: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  productGradient: {
    padding: 20,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skuBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  skuText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  priceCol: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  priceDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  }
});
