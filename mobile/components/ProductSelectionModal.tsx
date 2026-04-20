import React, { useState, useEffect } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
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
import { useThemeColor } from './Themed';
import { queryAll } from '@/lib/db';
import { SyncService } from '@/lib/sync/syncService';

interface ProductSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
  sellerId?: string;
  isAppending?: boolean; 
  initialItem?: any; // To support Edit Mode
  currentCartItems?: any[]; // To deduct pending cart items from available stock
}

export function ProductSelectionModal({ visible, onClose, onAdd, sellerId, initialItem, currentCartItems = [] }: ProductSelectionModalProps) {
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

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');

  const getRemainingStock = (p: any) => {
    if (!p) return 0;
    const inCart = (currentCartItems || [])
      .filter((i: any) => (i.productId === p.id || i.product?.id === p.id) && i.id !== initialItem?.id)
      .reduce((sum: number, i: any) => sum + Number(i.quantity || i.quantitySold || 0), 0);
    
    const editOffset = (initialItem && (initialItem.productId === p.id || initialItem.product?.id === p.id || initialItem.id === p.id))
      ? Number(initialItem.quantity || initialItem.quantitySold || 0)
      : 0;

    return Math.max(0, p.stock + editOffset - inCart);
  };

  useEffect(() => {
    if (visible) {
      if (initialItem) {
        setModalStep(2);
        // Retain original stock to properly calculate available space taking into account edit offsets
        setSelectedProduct({ 
          id: initialItem.productId || initialItem.product?.id, 
          name: initialItem.name || initialItem.productName || initialItem.product?.name, 
          priceCC: initialItem.unitPrice, 
          priceSC: initialItem.unitPrice,
          stock: initialItem.product?.stock ?? initialItem.stock ?? 99999 // fallback if unknown, handled dynamically upstream
        });
        setQuantity(initialItem.quantity || initialItem.quantitySold || 0);
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
      
      // 1. Try Local DB first
      const localData = await queryAll<any>(
        'SELECT * FROM products WHERE active = 1 ORDER BY name ASC'
      );
      
      if (localData.length > 0) {
        const mapped = localData.map(p => ({
          ...p,
          priceCC: p.price_cc,
          priceSC: p.price_sc,
          stock: p.stock // Use seller stock
        }));
        setAllProducts(mapped);
        setProductsLoading(false);
      }

      // 2. Background sync if online
      try {
        const apiURL = process.env.EXPO_PUBLIC_API_URL;
        const url = `${apiURL}/api/products?limit=500${sellerId ? `&sellerId=${sellerId}` : ''}`;
        const res = await fetch(url, {
          headers: { 'x-tenant-slug': tenantSlug || '' }
        });
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          setAllProducts(items);
          
          await SyncService.updateLocalProducts(items);
        }
      } catch (err) {
        // Silence noise
      }
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

  const availableStock = getRemainingStock(selectedProduct);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <DefaultView style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContent, { backgroundColor: backgroundColor, borderColor }]}
        >
          <DefaultView style={styles.modalHeader}>
            <DefaultText style={[styles.modalTitle, { color: textColor }]}>
              {modalStep === 1 ? 'Selecionar Produto' : 'Configurar Item'}
            </DefaultText>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={secondaryColor} />
            </TouchableOpacity>
          </DefaultView>

          {modalStep === 1 ? (
            <DefaultView style={{ flex: 1 }}>
              <DefaultView style={[styles.searchContainer, { backgroundColor: cardColor }]}>
                <Search size={18} color={secondaryColor} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Buscar produto..."
                  placeholderTextColor={placeholderColor}
                  style={[styles.searchInput, { color: textColor }]}
                  value={search}
                  onChangeText={setSearch}
                />
              </DefaultView>

              {productsLoading ? (
                <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={filteredProducts}
                  keyExtractor={p => p.id}
                  style={styles.modalBody}
                  renderItem={({ item: p }) => (
                    <TouchableOpacity 
                      style={[styles.productOption, { backgroundColor: cardColor, borderColor }]}
                      onPress={() => handleSelectProduct(p)}
                    >
                      <DefaultView style={{ flex: 1 }}>
                        <DefaultText style={[styles.optionName, { color: textColor }]}>{p.name}</DefaultText>
                        <DefaultView style={styles.optionPrices}>
                          <DefaultText style={[styles.optionPriceLabel, { color: secondaryColor }]}>
                            CC: <DefaultText style={[styles.optionPriceVal, { color: primaryColor }]}>{formatCurrencyBRL(p.priceCC)}</DefaultText>
                          </DefaultText>
                          <DefaultText style={[styles.optionPriceLabel, { color: secondaryColor }]}>
                            SC: <DefaultText style={[styles.optionPriceVal, { color: primaryColor }]}>{formatCurrencyBRL(p.priceSC)}</DefaultText>
                          </DefaultText>
                        </DefaultView>
                      </DefaultView>
                      <DefaultView style={[styles.stockBadge, { backgroundColor: primaryColor + '10' }]}>
                         <DefaultText style={[styles.stockLabel, { color: primaryColor }]}>ESTOQUE</DefaultText>
                         <DefaultText style={[styles.stockVal, { color: textColor }]}>{getRemainingStock(p)}</DefaultText>
                      </DefaultView>
                    </TouchableOpacity>
                  )}
                />
              )}
            </DefaultView>
          ) : selectedProduct ? (
            <DefaultView style={styles.configBody}>
              <DefaultText style={[styles.selectedName, { color: primaryColor }]}>{selectedProduct.name}</DefaultText>
              
              <DefaultText style={[styles.fieldLabel, { color: secondaryColor }]}>TIPO DE VENDA</DefaultText>
              <DefaultView style={styles.radioGroup}>
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
              </DefaultView>

              <DefaultText style={[styles.fieldLabel, { color: secondaryColor }]}>PREÇO DE VENDA</DefaultText>
              <TextInput
                style={[styles.priceInput, { backgroundColor: cardColor, color: textColor, borderColor }, selectedType === 'BRINDE' && styles.disabledInput]}
                value={customPrice}
                onChangeText={(val) => setCustomPrice(applyCurrencyMask(val))}
                keyboardType="numeric"
                editable={selectedType !== 'BRINDE'}
              />

              <DefaultText style={[styles.fieldLabel, { color: secondaryColor }]}>QUANTIDADE (Máx: {availableStock})</DefaultText>
              <DefaultView style={styles.qtyContainer}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: availableStock > 0 ? primaryColor : '#ccc' }]} 
                  onPress={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={availableStock <= 0}
                >
                  <Minus size={24} color="#FFF" />
                </TouchableOpacity>
                <TextInput
                  style={[styles.qtyVal, { color: textColor, width: 80, textAlign: 'center' }]}
                  value={String(quantity)}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    if (isNaN(parsed)) {
                      setQuantity(0);
                    } else if (parsed > availableStock) {
                      setQuantity(availableStock);
                    } else {
                      setQuantity(parsed);
                    }
                  }}
                  editable={availableStock > 0}
                />
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: availableStock > 0 && quantity < availableStock ? primaryColor : '#ccc' }]} 
                  onPress={() => setQuantity(q => Math.min(availableStock, q + 1))}
                  disabled={availableStock <= 0 || quantity >= availableStock}
                >
                  <Plus size={24} color="#FFF" />
                </TouchableOpacity>
              </DefaultView>

              <TouchableOpacity 
                style={[styles.addBtn, { backgroundColor: availableStock > 0 && quantity > 0 ? primaryColor : '#ccc' }]} 
                onPress={handleConfirm}
                disabled={availableStock <= 0 || quantity <= 0}
              >
                 <DefaultText style={[styles.addBtnText, { color: '#fff' }]}>
                   {availableStock <= 0 ? 'SEM ESTOQUE' : 'ADICIONAR À FICHA'}
                 </DefaultText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => setModalStep(1)}>
                 <DefaultText style={[styles.backBtnText, { color: secondaryColor }]}>Voltar para a lista</DefaultText>
              </TouchableOpacity>
            </DefaultView>
          ) : (
            <DefaultView style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color={primaryColor} />
            </DefaultView>
          )}
        </KeyboardAvoidingView>
      </DefaultView>
    </Modal>
  );
}

function RadioButton({ label, selected, onPress }: any) {
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');

  return (
    <TouchableOpacity style={[styles.radioItem, { backgroundColor: cardColor, borderColor }]} onPress={onPress}>
      <DefaultView style={[styles.radioCircle, { borderColor: secondaryColor }, selected && { borderColor: primaryColor, backgroundColor: primaryColor }]} />
      <DefaultText style={[styles.radioLabel, { color: secondaryColor }, selected && { color: textColor }]}>{label}</DefaultText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '90%', padding: 24, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 16 },
  modalBody: { flex: 1 },
  productOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  optionName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  optionPrices: { flexDirection: 'row', gap: 12 },
  optionPriceLabel: { fontSize: 12, fontWeight: '600' },
  optionPriceVal: { },
  stockBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  stockLabel: { fontSize: 8, fontWeight: '900' },
  stockVal: { fontSize: 14, fontWeight: '800' },
  
  configBody: { flex: 1, gap: 16 },
  selectedName: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  radioGroup: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  radioItem: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8, borderWidth: 1 },
  radioCircle: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  radioLabel: { fontSize: 10, fontWeight: '700' },
  priceInput: { height: 64, borderRadius: 16, fontSize: 24, fontWeight: '900', textAlign: 'center', borderWidth: 1 },
  disabledInput: { opacity: 0.5 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 40, marginVertical: 10 },
  qtyBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  qtyVal: { fontSize: 32, fontWeight: '900' },
  addBtn: { height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  addBtnText: { fontSize: 16, fontWeight: '900' },
  backBtn: { height: 50, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '700' }
});
