import React, { useState, useEffect } from 'react';
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
import { User, Lock, ArrowRight, RefreshCw } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginScreen() {
  const [appCode, setAppCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  
  const { tenantSlug, clearTenant, loginSeller } = useTenant();
  const router = useRouter();

  useEffect(() => {
    async function fetchCompanyInfo() {
      if (!tenantSlug) return;
      try {
        const res = await fetch(`${SERVER_URL}/tenant/info`, {
          headers: { 'x-tenant-slug': tenantSlug }
        });
        if (res.ok) {
          const data = await res.json();
          setCompanyName(data.name);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchCompanyInfo();
  }, [tenantSlug]);

  const handleLogin = async () => {
    if (!appCode || !password) {
      Alert.alert('Erro', 'Por favor, preencha código e senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/seller/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug || ''
        },
        body: JSON.stringify({ appCode, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Success! Persistence handled by context
        await loginSeller(data.user, data.token);
        router.replace('/(tabs)');
      } else {
        Alert.alert('Falha no Login', data.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro de Conexão', 'Falha ao autenticar.');
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
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Bem-vindo,</Text>
          <Text style={styles.companyName}>{companyName || tenantSlug}</Text>
          <TouchableOpacity onPress={clearTenant} style={styles.changeCompany}>
            <RefreshCw size={14} color="#7c3aed" />
            <Text style={styles.changeCompanyText}>Mudar empresa</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <User size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Código do Vendedor"
              placeholderTextColor="#666"
              value={appCode}
              onChangeText={setAppCode}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Acessar Painel</Text>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.help}>Esqueceu sua senha? Contate o gerente.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
  },
  welcome: {
    fontSize: 24,
    color: '#999',
  },
  companyName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
  },
  changeCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  changeCompanyText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111', 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 64,
    color: '#fff',
    fontSize: 18,
  },
  button: {
    height: 64,
    backgroundColor: '#7c3aed',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  help: {
    marginTop: 32,
    textAlign: 'center',
    color: '#444',
    fontSize: 14,
  }
});
