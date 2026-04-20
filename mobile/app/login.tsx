import React, { useState, useEffect } from 'react';
import { 
  View as DefaultView, 
  Text as DefaultText, 
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
import { useThemeColor } from '../components/Themed';
import { useColorScheme } from 'react-native';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginScreen() {
  const [appCode, setAppCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  
  const { tenantSlug, clearTenant, loginSeller } = useTenant();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const placeholderColor = useThemeColor({}, 'placeholder');
  const surfaceColor = useThemeColor({}, 'surface');

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
        await loginSeller(data.user, data.token);
        router.replace('/(main)');
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
      style={[styles.container, { backgroundColor }]}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <DefaultView style={styles.content}>
        <DefaultView style={styles.header}>
          <DefaultText style={[styles.welcome, { color: secondaryColor }]}>Bem-vindo,</DefaultText>
          <DefaultText style={[styles.companyName, { color: textColor }]}>{companyName || tenantSlug}</DefaultText>
          <TouchableOpacity onPress={clearTenant} style={styles.changeCompany}>
            <RefreshCw size={14} color={primaryColor} />
            <DefaultText style={[styles.changeCompanyText, { color: primaryColor }]}>Mudar empresa</DefaultText>
          </TouchableOpacity>
        </DefaultView>

        <DefaultView style={styles.form}>
          <DefaultView style={[styles.inputWrapper, { backgroundColor: surfaceColor, borderColor }]}>
            <User size={20} color={placeholderColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Código do Vendedor"
              placeholderTextColor={placeholderColor}
              value={appCode}
              onChangeText={setAppCode}
              keyboardType="number-pad"
            />
          </DefaultView>

          <DefaultView style={[styles.inputWrapper, { backgroundColor: surfaceColor, borderColor }]}>
            <Lock size={20} color={placeholderColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Senha"
              placeholderTextColor={placeholderColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </DefaultView>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: primaryColor, shadowColor: primaryColor }, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <DefaultText style={styles.buttonText}>Acessar Painel</DefaultText>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </DefaultView>

        <DefaultText style={[styles.help, { color: secondaryColor }]}>Esqueceu sua senha? Contate o gerente.</DefaultText>
      </DefaultView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  companyName: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  changeCompany: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  changeCompanyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 64,
    fontSize: 18,
  },
  button: {
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
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
    fontSize: 14,
  }
});
