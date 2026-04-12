import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
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

interface Product {
  id: string;
  name: string;
  sku: string;
  priceCC: number;
  priceSC: number;
  stockDeposit: number;
}

export default function ProductsScreen() {
  const { tenantSlug } = useTenant();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const res = await fetch(`${apiURL}/api/products?limit=1000`, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const data = await res.json();
      setProducts(data.items || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
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
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Produtos</Text>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            placeholder="Nome ou SKU..."
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.productCard}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.01)']}
                  style={styles.productGradient}
                >
                  <View style={styles.productHeader}>
                    <View style={styles.skuBadge}>
                      <Tag size={10} color="#10b981" />
                      <Text style={styles.skuText}>{item.sku}</Text>
                    </View>
                    <View style={[styles.stockBadge, item.stockDeposit <= 0 && styles.outOfStock]}>
                      <Text style={styles.stockLabel}>Qtd: </Text>
                      <Text style={styles.stockValue}>{item.stockDeposit}</Text>
                    </View>
                  </View>

                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  
                  <View style={styles.priceRow}>
                    <View style={styles.priceCol}>
                      <Text style={styles.priceLabel}>Preço (CC)</Text>
                      <Text style={styles.priceValue}>{formatCurrency(item.priceCC)}</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceCol}>
                      <Text style={styles.priceLabel}>Preço (SC)</Text>
                      <Text style={[styles.priceValue, { color: '#fbbf24' }]}>
                        {formatCurrency(item.priceSC)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Package size={48} color="#222" />
                <Text style={styles.emptyText}>Nenhum produto disponível.</Text>
              </View>
            }
          />
        )}
      </View>
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
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  skuText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStock: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  stockLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
  },
  stockValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  productName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 16,
  },
  priceCol: {
    flex: 1,
  },
  priceLabel: {
    color: '#555',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priceValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  priceDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    opacity: 0.5,
  },
  emptyText: {
    color: '#666',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  }
});
