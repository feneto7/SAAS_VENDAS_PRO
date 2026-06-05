import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, StatusBar, FlatList, Alert, ActivityIndicator 
} from 'react-native';
import { getGlobalStyles, getUIStyles, Shadows } from '../../theme/theme';
import { useTheme } from '../../stores/useThemeStore';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  ChevronLeft, Users, Package, TrendingDown, 
  Wallet, FileBarChart2, Power 
} from 'lucide-react-native';
import { db } from '../../services/database';

export const ChargeDetailScreen = () => {
  const { navigate, goBack, currentParams } = useNavigationStore();
  const { chargeId, chargeCode, routeName, routeId } = currentParams || {};

  const [ending, setEnding] = useState(false);

  const { colors, isDark } = useTheme();
  const GlobalStyles = useMemo(() => getGlobalStyles(colors), [colors]);
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const modules = [
    { 
      id: 'clients', 
      title: 'Clientes', 
      icon: Users, 
      color: colors.accent 
    },
    { 
      id: 'products', 
      title: 'Produtos', 
      icon: Package, 
      color: colors.info 
    },
    { 
      id: 'expenses', 
      title: 'Despesas', 
      icon: TrendingDown, 
      color: colors.danger 
    },
    { 
      id: 'deposits', 
      title: 'Depósitos', 
      icon: Wallet, 
      color: colors.success 
    },
    { 
      id: 'reports', 
      title: 'Relatórios', 
      icon: FileBarChart2, 
      color: colors.warning 
    },
  ];

  const handleCloseCharge = async () => {
    Alert.alert(
      'Encerrar Cobrança',
      'Deseja realmente encerrar esta cobrança? Todas as cards novas serão marcadas como pendentes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Encerrar', 
          style: 'destructive',
          onPress: performClose
        }
      ]
    );
  };

  const performClose = async () => {
    setEnding(true);
    try {
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      // 1. API Call
      const res = await fetch(`${API_URL}/api/collections/${chargeId}/close`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': tenantSlug || '' 
        }
      });

      if (!res.ok) throw new Error('Falha ao encerrar no servidor');

      // 2. Local Update
      await db.withTransactionAsync(async () => {
        // Atualizar cobrança
        await db.runAsync(
          "UPDATE charges SET status = 'encerrada' WHERE id = ?",
          [chargeId]
        );

        // Atualizar cards (Verification Logic)
        // 1. Fichas vinculadas a esta cobrança
        // 2. Fichas da mesma rota sem cobrança vinculada (web)
        await db.runAsync(
          `UPDATE cards SET status = 'pendente' 
           WHERE status = 'nova' 
           AND (charge_id = ? OR (charge_id IS NULL AND route_id = ?))`,
          [chargeId, routeId]
        );
      });

      Alert.alert('Sucesso', 'Cobrança encerrada com sucesso!');
      goBack();
    } catch (err) {
      console.error('Close charge error:', err);
      Alert.alert('Erro', 'Não foi possível encerrar a cobrança. Verifique sua conexão.');
    } finally {
      setEnding(false);
    }
  };

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={goBack} 
            style={styles.backBtn} 
            activeOpacity={0.7}
          >
            <ChevronLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>Cobrança #{chargeCode || '---'}</Text>
            <Text style={styles.subtitle}>{routeName || 'Rota'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Modules Grid */}
        <FlatList
          data={modules}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.moduleCard}
              activeOpacity={0.8}
              onPress={() => {
                if (item.id === 'clients') {
                  navigate('customers', { routeId, routeName, chargeId });
                } else if (item.id === 'reports') {
                  navigate('chargeReport', { chargeId, chargeCode, routeId, routeName });
                } else {
                  console.log(`Navigating to ${item.id}`);
                }
              }}
            >
              <item.icon size={36} color={item.color} strokeWidth={2.2} />
              <Text style={styles.cardTitle}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Footer Action */}
        <TouchableOpacity 
          style={[UI.button, styles.closeBtn, ending && { opacity: 0.7 }]} 
          onPress={handleCloseCharge}
          disabled={ending}
          activeOpacity={0.8}
        >
          {ending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Power size={20} color={colors.white} strokeWidth={2.5} />
              <Text style={styles.closeBtnText}>ENCERRAR COBRANÇA</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 32 
  },
  backBtn: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: colors.surface, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitleBox: { alignItems: 'center' },
  title: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: colors.textPrimary, 
    letterSpacing: 0.5 
  },
  subtitle: { 
    fontSize: 14, 
    color: colors.textSecondary, 
    marginTop: 2,
    fontWeight: '500'
  },
  list: { paddingBottom: 40 },
  row: { justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  
  moduleCard: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    gap: 12,
    ...Shadows.neumorphic(isDark),
  },
  
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: colors.textPrimary,
    letterSpacing: 0.3
  },
  closeBtn: {
    marginTop: 'auto',
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
    marginBottom: 20,
  },
  closeBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
