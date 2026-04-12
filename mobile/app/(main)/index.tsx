import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Map, 
  Package, 
  ChevronRight
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Menu */}
        <View style={styles.menuGrid}>
          
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={() => router.push('/routes')}
          >
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.1)', 'rgba(124, 58, 237, 0.05)']}
              style={styles.buttonGradient}
            >
              <View style={styles.buttonIconBox}>
                <Map size={24} color="#7c3aed" />
              </View>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Minhas Rotas</Text>
                <Text style={styles.buttonDesc}>Cidades e jornadas de hoje</Text>
              </View>
              <ChevronRight size={20} color="#333" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.mainButton}
            onPress={() => router.push('/products')}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.05)']}
              style={styles.buttonGradient}
            >
              <View style={[styles.buttonIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Package size={24} color="#10b981" />
              </View>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Produtos</Text>
                <Text style={styles.buttonDesc}>Estoque e Catálogo</Text>
              </View>
              <ChevronRight size={20} color="#333" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#111',
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
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flex: 1,
    marginLeft: 16,
  },
  buttonTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDesc: {
    color: '#666',
    fontSize: 12,
  }
});
