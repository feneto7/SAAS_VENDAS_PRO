import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogOut, ChevronLeft } from 'lucide-react-native';
import { useTenant } from '../../lib/TenantContext';

export default function MainLayout() {
  const { seller, companyName, logout, activeTrip } = useTenant();
  const router = useRouter();
  const segments = useSegments();

  // Determine path info
  const isTripDetail = (segments as any[]).includes('collection-detail');
  const isCollections = (segments as any[]).includes('collections');
  const isClientDetail = (segments as any[]).includes('client-detail');
  const isRoutes = (segments as any[]).includes('routes');
  const isProducts = (segments as any[]).includes('products');
  const isClients = (segments as any[]).includes('clients');
  const isNewFicha = (segments as any[]).includes('new-ficha');
  const isOrderDetail = (segments as any[]).includes('order-detail');
  const isFichaDetail = (segments as any[]).includes('ficha-detail');

  const currentPath = segments[segments.length - 1];
  // Bloqueia o botão voltar se estiver na Home (index) ou na tela de Rotas (se for o início da navegação)
  const isHome = (currentPath as string) === '(main)' || (currentPath as string) === 'index' || segments.length <= 1;

  const handleBack = () => {
    // Pegamos o caminho atual de forma robusta
    const path = segments.join('/');
    
    // Se estivermos em QUALQUER tela que não seja a Home/Dashboard, 
    // verificamos se devemos forçar a hierarquia linear.
    // Isso resolve o problema de o router.back() ou router.canGoBack() falhar em reloads.

    // 1. Ficha Detail -> Clientes
    if (path.includes('ficha-detail') || path.includes('new-ficha')) {
      router.replace('/(main)/clients');
      return;
    }

    // 2. Client Detail -> Clientes
    if (path.includes('client-detail')) {
      router.replace('/(main)/clients');
      return;
    }

    // 3. Pesquisa de Clientes -> Detalhe da Viagem (ou Collections)
    if (path.includes('clients')) {
      if (activeTrip?.id) {
        router.replace(`/(main)/collection-detail/${activeTrip.id}` as any);
      } else {
        router.replace('/(main)/routes');
      }
      return;
    }

    // 4. Detalhe da Viagem -> Lista de Cobranças (da Rota)
    if (path.includes('collection-detail')) {
      const rId = activeTrip?.routeId;
      if (rId) {
        router.replace(`/(main)/collections/${rId}` as any);
      } else {
        router.replace('/(main)/routes');
      }
      return;
    }

    // 5. Lista de Cobranças -> Minhas Rotas
    if (path.includes('collections')) {
      router.replace('/(main)/routes');
      return;
    }

    // 6. Minhas Rotas -> Dashboard
    if (path.includes('routes') || path.includes('products')) {
      router.replace('/(main)');
      return;
    }

    // Se estiver em outra tela e puder voltar nativamente, volta.
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      {/* PERSISTENT HEADER STRIP */}
      <View style={styles.topStrip}>
        <LinearGradient
          colors={['#1a1033', '#050505']}
          style={styles.stripGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              {/* LEFT: BACK BUTTON */}
              <View style={styles.headerSide}>
                {!isHome && (
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ChevronLeft size={24} color="#7c3aed" />
                  </TouchableOpacity>
                )}
              </View>

              {/* CENTER: BRANDING */}
              <View style={styles.headerCenter}>
                <Text style={styles.companyNameText}>{companyName || 'Empresa'}</Text>
                <Text style={styles.sellerNameText}>{seller?.name || 'Vendedor'}</Text>
              </View>

              {/* RIGHT: PROFILE */}
              <View style={styles.headerSide}>
                <TouchableOpacity style={styles.profileBadge}>
                  <User size={20} color="#7c3aed" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* CONTENT AREA (SLIDING) */}
      <View style={styles.content}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#050505' }
          }} 
        />
      </View>

      {/* PERSISTENT FOOTER LOGOUT - Hide when trip is active (inside detail, clients, client-detail, new-ficha, order-detail or ficha-detail) */}
      {!(isTripDetail || isCollections || isClientDetail || isNewFicha || isOrderDetail || isFichaDetail) && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Encerrar Sessão</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  topStrip: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.2)',
    zIndex: 10,
  },
  stripGradient: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 45 : 10,
  },
  headerSide: {
    width: 60,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -10,
  },
  companyNameText: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  sellerNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  profileBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 24,
    backgroundColor: '#050505',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
