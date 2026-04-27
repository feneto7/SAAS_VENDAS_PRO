import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, StatusBar, FlatList, Alert, ActivityIndicator 
} from 'react-native';
import { Colors, GlobalStyles, UI } from '../../theme/theme';
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

  const modules = [
    { 
      id: 'clients', 
      title: 'Clientes', 
      icon: Users, 
      color: Colors.primary 
    },
    { 
      id: 'products', 
      title: 'Produtos', 
      icon: Package, 
      color: Colors.info 
    },
    { 
      id: 'expenses', 
      title: 'Despesas', 
      icon: TrendingDown, 
      color: Colors.danger 
    },
    { 
      id: 'deposits', 
      title: 'Depósitos', 
      icon: Wallet, 
      color: Colors.success 
    },
    { 
      id: 'reports', 
      title: 'Relatórios', 
      icon: FileBarChart2, 
      color: Colors.warning 
    },
  ];

  const handleCloseCharge = async () => {
    Alert.alert(
      'Encerrar Cobrança',
      'Deseja realmente encerrar esta cobrança? Todas as fichas novas serão marcadas como pendentes.',
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
      const res = await fetch(`${API_URL}/api/cobrancas/${chargeId}/close`, {
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

        // Atualizar fichas (Verification Logic)
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
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} pointerEvents="none" />
      <View style={GlobalStyles.glowBottom} pointerEvents="none" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={goBack} 
            style={styles.backBtn} 
            activeOpacity={0.7}
          >
            <ChevronLeft color={Colors.white} size={24} />
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
              style={UI.moduleCard}
              activeOpacity={0.8}
              onPress={() => {
                if (item.id === 'clients') {
                  navigate('customers', { routeId, routeName });
                } else {
                  console.log(`Navigating to ${item.id}`);
                }
              }}
            >
              <item.icon size={36} color={Colors.white} strokeWidth={2.2} />
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
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Power size={20} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.closeBtnText}>ENCERRAR COBRANÇA</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: Colors.cardBg, 
    borderWidth: 1, 
    borderColor: Colors.cardBorder, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitleBox: { alignItems: 'center' },
  title: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: Colors.white, 
    letterSpacing: 0.5 
  },
  subtitle: { 
    fontSize: 14, 
    color: Colors.textSecondary, 
    marginTop: 2,
    fontWeight: '500'
  },
  list: { paddingBottom: 40 },
  row: { justifyContent: 'space-between', gap: 16, marginBottom: 16 },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: Colors.white,
    letterSpacing: 0.3
  },
  closeBtn: {
    marginTop: 'auto',
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
    marginBottom: 20,
  },
  closeBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
