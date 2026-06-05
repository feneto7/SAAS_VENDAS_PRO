import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { setupDatabase } from './src/services/database';
import { useAuthStore } from './src/stores/useAuthStore';
import { useNavigationStore } from './src/stores/useNavigationStore';
import { SelectTenant } from './src/Screens/SelectTenant/SelectTenant';
import { LoginScreen } from './src/Screens/Login/LoginScreen';
import { HomeScreen } from './src/Screens/Home/HomeScreen';
import { RoutesScreen } from './src/Screens/Routes/RoutesScreen';
import { ChargesScreen } from './src/Screens/Charges/ChargesScreen';
import { ChargeDetailScreen } from './src/Screens/ChargeDetail/ChargeDetailScreen';
import { ChargeReportScreen } from './src/Screens/ChargeReport/ChargeReportScreen';
import { CustomersScreen } from './src/Screens/Customers/CustomersScreen';
import { CustomerDetailScreen } from './src/Screens/CustomerDetail/CustomerDetailScreen';
import { CardDetailScreen } from './src/Screens/CardDetail';
import { OrdersDetailScreen } from './src/Screens/OrdersDetail/OrdersDetailScreen';
import { SyncService } from './src/services/syncService';
import { useTheme } from './src/stores/useThemeStore';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [step, setStep] = useState<'tenant' | 'login'>('tenant');

  const loadAuth = useAuthStore((state) => state.loadFromDb);
  const tenant = useAuthStore((state) => state.tenant);
  const user = useAuthStore((state) => state.user);
  const currentView = useNavigationStore((state) => state.currentView);
  const { colors } = useTheme();

  useEffect(() => {
    const init = async () => {
      await setupDatabase();
      loadAuth();
      SyncService.init(); // Ativa o sincronismo automático
      setDbReady(true);
    };
    init();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Roteamento Simples (Sem expo-router via ESM)
  if (user) {
    if (currentView === 'routes') {
      return <RoutesScreen />;
    }
    if (currentView === 'charges') {
      return <ChargesScreen />;
    }
    if (currentView === 'chargeDetail') {
      return <ChargeDetailScreen />;
    }
    if (currentView === 'chargeReport') {
      return <ChargeReportScreen />;
    }
    if (currentView === 'customers') {
      return <CustomersScreen />;
    }
    if (currentView === 'customerDetail') {
      return <CustomerDetailScreen />;
    }
    if (currentView === 'cardDetail') {
      return <CardDetailScreen />;
    }
    if (currentView === 'ordersDetail') {
      return <OrdersDetailScreen />;
    }
    return <HomeScreen />;
  }

  if (step === 'tenant' || !tenant) {
    return <SelectTenant onNext={() => setStep('login')} />;
  }

  return <LoginScreen onBack={() => setStep('tenant')} />;
}
