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
  const isRoutes = (segments as any[]).includes('routes');
  const isProducts = (segments as any[]).includes('products');

  const currentPath = segments[segments.length - 1];
  const isHome = currentPath === '(main)' || currentPath === 'index' || segments.length <= 1;

  const handleBack = () => {
    // 1. Hierarchy Mapping
    if (isTripDetail && activeTrip) {
      // Detail -> Collections
      router.replace(`/(main)/collections/${activeTrip.routeId}` as any);
    } else if (isCollections) {
      // Collections -> Routes
      router.replace('/(main)/routes' as any);
    } else if (isRoutes || isProducts) {
      // Routes/Products -> Home
      router.replace('/(main)/' as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
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

      {/* PERSISTENT FOOTER LOGOUT */}
      {!isTripDetail && (
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
