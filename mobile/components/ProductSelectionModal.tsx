import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { Search, X, Plus, Minus } from 'lucide-react-native';
import { formatCurrencyBRL, centsToReais, applyCurrencyMask, parseBRLToCents } from '@/lib/utils/money';
import { useTenant } from '@/lib/TenantContext';

interface ProductSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
  sellerId?: string;
  isAppending?: boolean; 
  initialItem?: any; // To support Edit Mode
}

export function ProductSelectionModal({ visible, onClose, onAdd, sellerId, initialItem }: ProductSelectionModalProps) {
  const { tenantSlug } = useTenant();
  
  const [modalStep, setModalStep] = useState(1); 
  const [search, setSearch] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Config State
  const [quantity, setQuantity] = useState(1);
  const [selectedType, setSelectedType] = useState<'CC' | 'SC' | 'BRINDE'>('CC');
  const [customPrice, setCustomPrice] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialItem) {
        setModalStep(2);
        setSelectedProduct({ id: initialItem.productId, name: initialItem.name, priceCC: initialItem.unitPrice, priceSC: initialItem.unitPrice });
        setQuantity(initialItem.quantity);
        setSelectedType(initialItem.commissionType || initialItem.type || 'CC');
        setCustomPrice(applyCurrencyMask(centsToReais(initialItem.unitPrice).toFixed(2).replace('.', ',')));
      } else {
        setModalStep(1);
        setSearch('');
        fetchProducts();
      }
    }
  }, [visible, sellerId, initialItem]);

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const apiURL = process.env.EXPO_PUBLIC_API_URL;
      const url = `${apiURL}/api/products?limit=500${sellerId ? `&sellerId=${sellerId}` : ''}`;
      const res = await fetch(url, {
        headers: { 'x-tenant-slug': tenantSlug || '' }
      });
      const data = await res.json();
      setAllProducts(data.items || []);
    } catch (err) {
      console.error('Fetch products failed:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setSelectedType('CC');
    const initialPrice = centsToReais(product.priceCC || 0).toFixed(2).replace('.', ',');
    setCustomPrice(applyCurrencyMask(initialPrice));
    setQuantity(1);
    setModalStep(2);
  };

  const handleTypeChange = (type: 'CC' | 'SC' | 'BRINDE') => {
    setSelectedType(type);
    if (type === 'BRINDE') {
      setCustomPrice('0,00');
    } else if (type === 'CC' && selectedProduct) {
      const p = centsToReais(selectedProduct.priceCC || 0).toFixed(2).replace('.', ',');
      setCustomPrice(applyCurrencyMask(p));
    } else if (type === 'SC' && selectedProduct) {
      const p = centsToReais(selectedProduct.priceSC || 0).toFixed(2).replace('.', ',');
      setCustomPrice(applyCurrencyMask(p));
    }
  };

  const handleConfirm = () => {
    if (!selectedProduct) return;
    const priceCents = parseBRLToCents(customPrice);
    
    // In local mode (New Ficha), we just return the object
    // In appending mode (Ficha Detail), the parent might handle the API call
    onAdd({
      productId: selectedProduct.id,
      name: selectedProduct.name,
      type: selectedType,
      quantity,
      unitPrice: priceCents,
      subtotal: priceCents * quantity
    });
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {modalStep === 1 ? 'Selecionar Produto' : 'Configurar Item'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {modalStep === 1 ? (
            <View style={{ flex: 1 }}>
              <View style={styles.searchContainer}>
                <Search size={18} color="#4B5563" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Buscar produto..."
                  placeholderTextColor="#4B5563"
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {productsLoading ? (
                <ActivityIndicator size="large" color="#A78BFA" style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={filteredProducts}
                  keyExtractor={p => p.id}
                  style={styles.modalBody}
                  renderItem={({ item: p }) => (
                    <TouchableOpacity 
                      style={styles.productOption}
                      onPress={() => handleSelectProduct(p)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionName}>{p.name}</Text>
                        <View style={styles.optionPrices}>
                          <Text style={styles.optionPriceLabel}>
                            CC: <Text style={styles.optionPriceVal}>{formatCurrencyBRL(p.priceCC)}</Text>
                          </Text>
                          <Text style={styles.optionPriceLabel}>
                            SC: <Text style={styles.optionPriceVal}>{formatCurrencyBRL(p.priceSC)}</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={styles.stockBadge}>
                         <Text style={styles.stockLabel}>ESTOQUE</Text>
                         <Text style={styles.stockVal}>{p.stock}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          ) : selectedProduct ? (
            <View style={styles.configBody}>
              <Text style={styles.selectedName}>{selectedProduct.name}</Text>
              
              <Text style={styles.fieldLabel}>TIPO DE VENDA</Text>
              <View style={styles.radioGroup}>
                 <RadioButton 
                  label="Com Comissão" 
                  selected={selectedType === 'CC'} 
                  onPress={() => handleTypeChange('CC')} 
                 />
                 <RadioButton 
                  label="Sem Comissão" 
                  selected={selectedType === 'SC'} 
                  onPress={() => handleTypeChange('SC')} 
                 />
                 <RadioButton 
                  label="Brinde" 
                  selected={selectedType === 'BRINDE'} 
                  onPress={() => handleTypeChange('BRINDE')} 
                 />
              </View>

              <Text style={styles.fieldLabel}>PREÇO DE VENDA</Text>
              <TextInput
                style={[styles.priceInput, selectedType === 'BRINDE' && styles.disabledInput]}
                value={customPrice}
                onChangeText={(val) => setCustomPrice(applyCurrencyMask(val))}
                keyboardType="numeric"
                editable={selectedType !== 'BRINDE'}
              />

              <Text style={styles.fieldLabel}>QUANTIDADE</Text>
              <View style={styles.qtyContainer}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => Math.max(1, q - 1))}>
                  <Minus size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(q => q + 1)}>
                  <Plus size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.addBtn} onPress={handleConfirm}>
                 <Text style={styles.addBtnText}>ADICIONAR À FICHA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setModalStep(1)}>
                 <Text style={styles.backBtnText}>Voltar para a lista</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#A78BFA" />
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function RadioButton({ label, selected, onPress }: any) {
  return (
    <TouchableOpacity style={styles.radioItem} onPress={onPress}>
      <View style={[styles.radioCircle, selected && styles.radioSelected]} />
      <Text style={[styles.radioLabel, selected && styles.radioLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0F1117', borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', padding: 24, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.2)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 12 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16 },
  modalBody: { flex: 1 },
  productOption: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  optionName: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  optionPrices: { flexDirection: 'row', gap: 12 },
  optionPriceLabel: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  optionPriceVal: { color: '#A78BFA' },
  stockBadge: { backgroundColor: 'rgba(167, 139, 250, 0.1)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  stockLabel: { color: '#A78BFA', fontSize: 8, fontWeight: '900' },
  stockVal: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  
  configBody: { flex: 1, gap: 16 },
  selectedName: { color: '#A78BFA', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  fieldLabel: { color: '#4B5563', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  radioGroup: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  radioItem: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  radioCircle: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#4B5563' },
  radioSelected: { borderColor: '#A78BFA', backgroundColor: '#A78BFA' },
  radioLabel: { color: '#6B7280', fontSize: 10, fontWeight: '700' },
  radioLabelActive: { color: '#FFF' },
  priceInput: { backgroundColor: '#1F2937', height: 64, borderRadius: 16, color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  disabledInput: { opacity: 0.5, backgroundColor: '#111827' },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40, marginVertical: 10 },
  qtyBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#A78BFA', justifyContent: 'center', alignItems: 'center' },
  qtyVal: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  addBtn: { backgroundColor: '#FFF', height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  addBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  backBtn: { height: 50, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { color: '#6B7280', fontSize: 14, fontWeight: '700' }
});
