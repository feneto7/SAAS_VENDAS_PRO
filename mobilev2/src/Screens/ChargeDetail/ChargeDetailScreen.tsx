import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, StatusBar, FlatList 
} from 'react-native';
import { Colors, GlobalStyles, UI } from '../../theme/theme';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { 
  ChevronLeft, Users, Package, TrendingDown, 
  Wallet, FileBarChart2 
} from 'lucide-react-native';

export const ChargeDetailScreen = () => {
  const { navigate, goBack, currentParams } = useNavigationStore();
  const { chargeId, chargeCode, routeName, routeId } = currentParams || {};

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

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} />

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
      </View>
      <View style={GlobalStyles.glowBottom} />
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
  }
});
