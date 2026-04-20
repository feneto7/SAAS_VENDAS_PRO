import React from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Stack, useRouter, useSegments, useGlobalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, LogOut, ChevronLeft, RefreshCcw, CloudOff, Cloud } from 'lucide-react-native';
import { useTenant } from '../../lib/TenantContext';
import { useThemeColor } from '../../components/Themed';
import { useSync } from '../../hooks/useSync';

export default function MainLayout() {
  const { seller, companyName, logout, activeTrip } = useTenant();
  const { isOnline, pendingCount, forceSync } = useSync();
  const router = useRouter();
  const segments = useSegments();
  const params = useGlobalSearchParams();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const borderColor = useThemeColor({}, 'border');
  const errorColor = useThemeColor({}, 'error');

  // Determine path info
  const isTripDetail = (segments as any[]).includes('collection-detail');
  const isCollections = (segments as any[]).includes('collections');
  const isClientDetail = (segments as any[]).includes('client-detail');
  const isRoutes = (segments as any[]).includes('routes');
  const isProducts = (segments as any[]).includes('products');
  const isClients = (segments as any[]).includes('clients');
  const isNewCard = (segments as any[]).includes('new-card');
  const isOrderDetail = (segments as any[]).includes('order-detail');
  const isCardDetail = (segments as any[]).includes('card-detail');

  const currentPath = segments[segments.length - 1];
  // Bloqueia o botão voltar se estiver na Home (index) ou na tela de Rotas (se for o início da navegação)
  const isHome = (currentPath as string) === '(main)' || (currentPath as string) === 'index' || segments.length <= 1;

  const handleBack = () => {
    // Pegamos o caminho atual de forma robusta
    const path = segments.join('/');
    
    // Se estivermos em QUALQUER tela que não seja a Home/Dashboard, 
    // verificamos se devemos forçar a hierarquia linear.
    // Isso resolve o problema de o router.back() ou router.canGoBack() falhar em reloads.

    // 1. New Card -> Client Detail (Aba Novas)
    if (path.includes('new-card')) {
      const clientId = params.clientId || segments[segments.length - 1];
      router.replace({
        pathname: `/(main)/client-detail/${clientId}`,
        params: { 
          id: clientId,
          tab: 'novas',
          clientName: params.clientName,
          routeName: params.routeName
        }
      } as any);
      return;
    }

    // 2. Card Detail -> Client Detail (if possible, else Clientes)
    if (path.includes('card-detail')) {
      const clientIdParam = params.clientId as string;
      
      if (clientIdParam) {
        router.replace({
          pathname: `/(main)/client-detail/${clientIdParam}`,
          params: { 
            tab: 'pendentes',
            clientName: params.clientName,
            routeName: params.routeName
          }
        } as any);
      } else {
        router.replace('/(main)/clients');
      }
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
    <DefaultView style={[styles.container, { backgroundColor }]}>
      {/* PERSISTENT HEADER STRIP */}
      <DefaultView style={[styles.topStrip, { borderBottomColor: borderColor }]}>
        <LinearGradient
          colors={[primaryColor + '20', backgroundColor]}
          style={styles.stripGradient}
        >
          <SafeAreaView edges={['top']}>
            <DefaultView style={styles.headerContent}>
              {/* LEFT: BACK BUTTON */}
              <DefaultView style={styles.headerSide}>
                {!isHome && (
                  <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <ChevronLeft size={24} color={primaryColor} />
                  </TouchableOpacity>
                )}
              </DefaultView>

              {/* CENTER: BRANDING */}
              <DefaultView style={styles.headerCenter}>
                <DefaultText style={[styles.companyNameText, { color: primaryColor }]}>{companyName || 'Empresa'}</DefaultText>
                <DefaultText style={[styles.sellerNameText, { color: textColor }]}>{seller?.name || 'Vendedor'}</DefaultText>
              </DefaultView>

              {/* RIGHT: PROFILE & SYNC */}
              <DefaultView style={[styles.headerSide, { flexDirection: 'row', width: 100, gap: 8 }]}>
                {pendingCount > 0 ? (
                  <TouchableOpacity onPress={forceSync} style={styles.syncBadge}>
                    <RefreshCcw size={16} color={primaryColor} />
                    <DefaultText style={[styles.pendingText, { color: primaryColor }]}>{pendingCount}</DefaultText>
                  </TouchableOpacity>
                ) : (
                  <DefaultView style={styles.syncIconOnly}>
                    {isOnline ? <Cloud size={20} color={primaryColor} /> : <CloudOff size={20} color={errorColor} />}
                  </DefaultView>
                )}
                
                <TouchableOpacity style={[styles.profileBadge, { backgroundColor: primaryColor + '10', borderColor: primaryColor + '20' }]}>
                  <User size={20} color={primaryColor} />
                </TouchableOpacity>
              </DefaultView>
            </DefaultView>
          </SafeAreaView>
        </LinearGradient>
      </DefaultView>

      {/* CONTENT AREA (SLIDING) */}
      <DefaultView style={styles.content}>
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor }
          }} 
        />
      </DefaultView>

      {/* PERSISTENT FOOTER LOGOUT - Hide when trip or list is active */}
      {!(isTripDetail || isCollections || isClientDetail || isNewCard || isOrderDetail || isCardDetail || isClients) && (
        <DefaultView style={[styles.footer, { backgroundColor, borderTopColor: borderColor }]}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={errorColor} />
            <DefaultText style={[styles.logoutText, { color: errorColor }]}>Encerrar Sessão</DefaultText>
          </TouchableOpacity>
        </DefaultView>
      )}
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topStrip: {
    width: '100%',
    borderBottomWidth: 1,
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
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 2,
  },
  sellerNameText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileBadge: {
    width: 40,
    height: 40,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  logoutText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '900',
  },
  syncIconOnly: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
