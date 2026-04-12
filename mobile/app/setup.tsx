import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTenant } from '../lib/TenantContext';
import { Zap, Building2, ChevronRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function SetupScreen() {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const { setTenant } = useTenant();
  const router = useRouter();

  const handleIdentify = async () => {
    if (!slug) {
      Alert.alert('Erro', 'Por favor, digite o código da empresa.');
      return;
    }

    setLoading(true);
    try {
      // Validate slug with backend
      const res = await fetch(`${SERVER_URL}/tenant/info`, {
        headers: { 'x-tenant-slug': slug.toLowerCase().trim() }
      });

      if (res.ok) {
        const data = await res.json();
        await setTenant(slug.toLowerCase().trim(), data.name);
        router.replace('/login');
      } else {
        Alert.alert('Não encontrado', 'Empresa não encontrada. Verifique o código e tente novamente.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      {/* Background Glow */}
      <View style={styles.glow} />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Zap color="#fff" size={32} />
          </View>
        </View>

        <Text style={styles.title}>Vendas PRO</Text>
        <Text style={styles.subtitle}>Gestão e Logística</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Identifique sua Empresa</Text>
          <Text style={styles.cardDesc}>Digite o código fornecido pelo seu administrador.</Text>

          <View style={styles.inputWrapper}>
            <Building2 size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Código da Empresa"
              placeholderTextColor="#666"
              value={slug}
              onChangeText={setSlug}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleIdentify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continuar</Text>
                <ChevronRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2026 Vendas PRO. Todos os direitos reservados.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    filter: 'blur(80px)',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 48,
  },
  card: {
    width: '100%',
    backgroundColor: '#0a0a0a', 
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111', 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    height: 56,
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: '#333',
  }
});
