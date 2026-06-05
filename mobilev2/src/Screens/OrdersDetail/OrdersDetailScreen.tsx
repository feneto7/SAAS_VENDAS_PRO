import React, { useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, 
  SafeAreaView, StatusBar, FlatList, StyleSheet, ActivityIndicator
} from 'react-native';
import { ChevronLeft, ShoppingBag, Package } from 'lucide-react-native';
import { getGlobalStyles, getUIStyles, Shadows } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useTheme } from '../../stores/useThemeStore';
import { useOrdersDetail } from './hooks/useOrdersDetail';
import { formatCentsToBRL } from '../../utils/money';

export const OrdersDetailScreen = () => {
  const { goBack, currentParams } = useNavigationStore();
  const { cardId, code, total, clientName } = currentParams || {};

  const { colors, isDark } = useTheme();
  const GlobalStyles = useMemo(() => getGlobalStyles(colors), [colors]);
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const { items, card, isGenerating, loading, handleGerarFicha } = useOrdersDetail(cardId);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'CC': return { color: colors.success, label: 'CC' };
      case 'SC': return { color: colors.info, label: 'SC' };
      case 'brinde': return { color: colors.warning, label: 'Brinde' };
      default: return { color: colors.textSecondary, label: type };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const { color, label } = getTypeStyle(item.type);
    const price = item.price ?? item.unit_price ?? 0;
    const displaySubtotal = (item.quantity || 0) * price;

    return (
      <View style={UI.listItem}>
        <View style={styles.itemMain}>
          <View style={styles.itemHeader}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={[styles.productType, { color }]}>{label}</Text>
          </View>
          
          <View style={styles.itemFooter}>
            <View style={styles.qtyBox}>
              <Package size={14} color={colors.textSecondary} />
              <Text style={styles.qtyText}>
                {`${item.quantity} un x ${formatCentsToBRL(price)}`}
              </Text>
            </View>
            <Text style={styles.subtotalText}>{formatCentsToBRL(displaySubtotal)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShoppingBag size={18} color={colors.accent} />
              <Text style={styles.title} numberOfLines={1}>Pedido #{code}</Text>
            </View>
            <Text style={styles.subtitle}>{clientName}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Valor Total</Text>
          <Text style={styles.infoTotal}>{formatCentsToBRL(card?.total || total)}</Text>
          <Text style={styles.infoDesc}>Revise os itens solicitados pelo cliente abaixo. Ao gerar a card, este pedido passará para o status "Nova".</Text>
        </View>

        {/* Items List */}
        <Text style={styles.sectionTitle}>Itens Solicitados</Text>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
             <View style={{ alignItems: 'center', padding: 40 }}>
                {loading ? (
                  <ActivityIndicator color={colors.accent} />
                ) : (
                  <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>Nenhum item solicitado.</Text>
                )}
             </View>
          }
        />

        {/* Footer Action */}
        <View style={styles.footerAction}>
          <TouchableOpacity 
            style={[UI.button, isGenerating && styles.buttonDisabled]} 
            activeOpacity={0.8}
            onPress={handleGerarFicha}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={UI.buttonText}>Gerar Ficha</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { alignItems: 'center', flex: 1, marginHorizontal: 12 },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  
  infoCard: {
    backgroundColor: colors.surfaceRaised,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    alignItems: 'center'
  },
  infoTitle: { fontSize: 12, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  infoTotal: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, marginVertical: 8 },
  infoDesc: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  list: { paddingBottom: 100 },
  
  itemInfo: { flex: 1, padding: 4 },
  itemMain: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  productType: { fontSize: 12, fontWeight: '700', marginLeft: 8 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  subtotalText: { fontSize: 17, fontWeight: '900', color: colors.accent },

  footerAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 30
  },
  buttonDisabled: { opacity: 0.6 }
});
