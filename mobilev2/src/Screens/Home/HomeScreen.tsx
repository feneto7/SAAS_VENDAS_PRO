import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { Colors, GlobalStyles, UI } from '../../theme/theme';
import { Map, PackageSearch, LogOut } from 'lucide-react-native';

export const HomeScreen = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const user = useAuthStore((state) => state.user);
  const tenant = useAuthStore((state) => state.tenant);
  const logout = useAuthStore((state) => state.logout);

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} />
      
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Olá, {user?.name}</Text>
            <Text style={styles.sub}>{tenant?.name || tenant?.slug}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={UI.actionCard} activeOpacity={0.8} onPress={() => navigate('routes')}>
            <Map size={36} color={Colors.white} strokeWidth={2.2} />
            <Text style={styles.cardTitle}>Minhas Rotas</Text>
            <Text style={styles.cardSub}>Inicie suas vendas e visitas programadas para hoje.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={UI.actionCard} activeOpacity={0.8}>
            <PackageSearch size={36} color={Colors.white} strokeWidth={2.2} />
            <Text style={styles.cardTitle}>Produtos</Text>
            <Text style={styles.cardSub}>Consulte o catálogo, tabela de preços e saldo do estoque.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.logoutFooterBtn} onPress={logout} activeOpacity={0.7}>
          <LogOut size={20} color={Colors.textSecondary} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={GlobalStyles.glowBottom} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingTop: 48,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  welcome: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  grid: {
    gap: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 14,
    color: Colors.textSecondary, // Replacing rgba(255,255,255,0.8) with semantic token
    lineHeight: 22,
    fontWeight: '500',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoutFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  }
});
