import React from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useTenant } from '../../lib/TenantContext';
import { SyncService } from '../../lib/sync/syncService';
import { 
  Map, 
  Package, 
  ChevronRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '../../components/Themed';

export default function DashboardScreen() {
  const { tenantSlug, seller } = useTenant();
  const router = useRouter();
  const [syncing, setSyncing] = React.useState(false);

  useEffect(() => {
    if (tenantSlug) {
      // Background sync on start
      SyncService.downloadMasterData(tenantSlug, seller?.id).catch(e => console.log('Initial sync failed'));
      SyncService.processQueue().catch(e => console.log('Initial queue processing failed'));
    }
  }, [tenantSlug]);

  const handleManualSync = async () => {
    if (!tenantSlug || syncing) return;
    try {
      setSyncing(true);
      await SyncService.downloadMasterData(tenantSlug, seller?.id);
      await SyncService.processQueue();
    } finally {
      setSyncing(false);
    }
  };
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const successColor = useThemeColor({}, 'success');
  const infoColor = useThemeColor({}, 'primary');

  return (
    <DefaultView style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Menu */}
        <DefaultView style={styles.menuGrid}>
          
          <TouchableOpacity 
            style={[styles.mainButton, { backgroundColor: cardColor, borderColor }]}
            onPress={() => router.push('/routes')}
          >
            <LinearGradient
              colors={[primaryColor + '15', primaryColor + '05']}
              style={styles.buttonGradient}
            >
              <DefaultView style={[styles.buttonIconBox, { backgroundColor: primaryColor + '15' }]}>
                <Map size={24} color={primaryColor} />
              </DefaultView>
              <DefaultView style={styles.buttonContent}>
                <DefaultText style={[styles.buttonTitle, { color: textColor }]}>Minhas Rotas</DefaultText>
                <DefaultText style={[styles.buttonDesc, { color: secondaryColor }]}>Cidades e jornadas de hoje</DefaultText>
              </DefaultView>
              <ChevronRight size={20} color={secondaryColor} />
            </LinearGradient>
          </TouchableOpacity>
 
          <TouchableOpacity 
            style={[styles.mainButton, { backgroundColor: cardColor, borderColor }]}
            onPress={() => router.push('/products')}
          >
            <LinearGradient
              colors={[successColor + '15', successColor + '05']}
              style={styles.buttonGradient}
            >
              <DefaultView style={[styles.buttonIconBox, { backgroundColor: successColor + '15' }]}>
                <Package size={24} color={successColor} />
              </DefaultView>
              <DefaultView style={styles.buttonContent}>
                <DefaultText style={[styles.buttonTitle, { color: textColor }]}>Produtos</DefaultText>
                <DefaultText style={[styles.buttonDesc, { color: secondaryColor }]}>Estoque e Catálogo</DefaultText>
              </DefaultView>
              <ChevronRight size={20} color={secondaryColor} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.mainButton, { backgroundColor: cardColor, borderColor }]}
            onPress={handleManualSync}
            disabled={syncing}
          >
            <LinearGradient
              colors={[infoColor + '15', infoColor + '05']}
              style={styles.buttonGradient}
            >
              <DefaultView style={[styles.buttonIconBox, { backgroundColor: infoColor + '15' }]}>
                {syncing ? (
                  <ActivityIndicator color={infoColor} />
                ) : (
                  <Package size={24} color={infoColor} /> // Or RefreshCw but Package looks consistent
                )}
              </DefaultView>
              <DefaultView style={styles.buttonContent}>
                <DefaultText style={[styles.buttonTitle, { color: textColor }]}>Sincronizar Agora</DefaultText>
                <DefaultText style={[styles.buttonDesc, { color: secondaryColor }]}>Atualizar saldos e cobranças</DefaultText>
              </DefaultView>
              <ChevronRight size={20} color={secondaryColor} />
            </LinearGradient>
          </TouchableOpacity>
        </DefaultView>
      </ScrollView>
    </DefaultView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  menuGrid: {
    gap: 12,
  },
  mainButton: {
    width: '100%',
    height: 90,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flex: 1,
    marginLeft: 16,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDesc: {
    fontSize: 12,
  }
});
