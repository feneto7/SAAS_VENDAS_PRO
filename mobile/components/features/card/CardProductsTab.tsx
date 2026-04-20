import React from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle
} from 'react-native';
import { Package, Pencil, Trash2, CheckCircle2 } from 'lucide-react-native';
import { useThemeColor } from '../../../components/Themed';

interface CardProductsTabProps {
  items: any[];
  isPaid: boolean;
  status: string;
  onOpenItemModal: (item: any) => void;
  onEditItem: (item: any) => void;
  onDeleteItem: (itemId: string) => void;
  onSaveSettlement: () => void;
  saveLoading: boolean;
  formatCurrencyBRL: (val: number) => string;
}

export function CardProductsTab({
  items,
  isPaid,
  status,
  onOpenItemModal,
  onEditItem,
  onDeleteItem,
  onSaveSettlement,
  saveLoading,
  formatCurrencyBRL
}: CardProductsTabProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');
  const placeholderColor = useThemeColor({}, 'placeholder');

  if (items.length === 0) {
    return (
      <DefaultView style={styles.emptyContainer}>
        <Package size={48} color={borderColor} />
        <DefaultText style={[styles.emptyText, { color: textColor }]}>Nenhum produto nesta ficha</DefaultText>
      </DefaultView>
    );
  }

  return (
    <DefaultView style={styles.container}>
      {items.map(item => (
        <DefaultView key={item.id} style={[styles.itemCard, { backgroundColor: cardColor, borderColor }, isPaid && { opacity: 0.8 }]}>
          <DefaultView style={{ flex: 1 }}>
            <DefaultText style={[styles.itemName, { color: textColor }]}>{item.productName || item.product?.name || 'Produto'}</DefaultText>
            <DefaultView style={styles.itemMeta}>
              <DefaultText style={[
                styles.itemType, 
                { color: item.commissionType === 'BRINDE' ? errorColor : (item.commissionType === 'SC' ? '#60A5FA' : primaryColor) }
              ]}>
                {item.commissionType}
              </DefaultText>
              <DefaultText style={[styles.itemPrice, { color: secondaryColor }]}>{formatCurrencyBRL(item.unitPrice)} x {item.quantity}</DefaultText>
            </DefaultView>
          </DefaultView>

          {status === 'nova' ? (
            <DefaultView style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <DefaultView style={{ alignItems: 'flex-end' }}>
                <DefaultText style={[styles.itemSubtotal, { color: textColor, fontSize: 16, fontWeight: '900' }]}>
                  {formatCurrencyBRL(item.subtotal)}
                </DefaultText>
                <DefaultView style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity 
                    onPress={() => onEditItem(item)}
                    style={{ padding: 6, backgroundColor: `${primaryColor}10`, borderRadius: 8 }}
                  >
                    <Pencil size={16} color={primaryColor} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => onDeleteItem(item.id)}
                    style={{ padding: 6, backgroundColor: `${errorColor}15`, borderRadius: 8 }}
                  >
                    <Trash2 size={16} color={errorColor} />
                  </TouchableOpacity>
                </DefaultView>
              </DefaultView>
            </DefaultView>
          ) : (
            <TouchableOpacity 
              style={styles.itemQuantities}
              onPress={() => !isPaid && onOpenItemModal(item)}
              disabled={isPaid}
            >
              <DefaultView style={styles.qtyBox}>
                <DefaultText style={[styles.qtyLabel, { color: placeholderColor }]}>DEIXADO</DefaultText>
                <DefaultText style={[styles.qtyVal, { color: secondaryColor }]}>{item.quantity}</DefaultText>
              </DefaultView>
              <DefaultView style={[styles.qtyBox, { borderLeftWidth: 1, borderLeftColor: borderColor }]}>
                <DefaultText style={[styles.qtyLabel, { color: placeholderColor }]}>VENDIDO</DefaultText>
                <DefaultText style={[styles.qtyValPrimary, { color: primaryColor }]}>{item.quantitySold || 0}</DefaultText>
              </DefaultView>
            </TouchableOpacity>
          )}
        </DefaultView>
      ))}
      
      {status === 'pendente' && (
        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: primaryColor }]}
          onPress={onSaveSettlement}
          disabled={saveLoading}
        >
          {saveLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <DefaultText style={[styles.saveBtnText, { color: '#fff' }]}>SALVAR ACERTO</DefaultText>
              <CheckCircle2 size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      )}

      {status === 'nova' && (
        <DefaultView style={{ height: 100 }} />
      )}
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 100, opacity: 0.3 },
  emptyText: { fontSize: 16, fontWeight: '800', marginTop: 16 },
  itemCard: { 
    flexDirection: 'row', 
    borderRadius: 16, 
    padding: 16,
    borderWidth: 1,
    alignItems: 'center'
  },
  itemName: { fontSize: 15, fontWeight: '700' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  itemType: { fontSize: 10, fontWeight: '900' },
  itemPrice: { fontSize: 12 },
  itemQuantities: { flexDirection: 'row', gap: 16 },
  qtyBox: { alignItems: 'center', minWidth: 60 },
  qtyLabel: { fontSize: 8, fontWeight: '900' },
  qtyVal: { fontSize: 16, fontWeight: '700' },
  qtyValPrimary: { fontSize: 18, fontWeight: '900' },
  itemSubtotal: { fontSize: 16, fontWeight: '900' },
  saveBtn: { 
    marginTop: 20,
    height: 56, 
    borderRadius: 16, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12 
  },
  saveBtnText: { fontSize: 14, fontWeight: '900' },
});
