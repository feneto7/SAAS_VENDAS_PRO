import React, { useState } from 'react';
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
import { Zap, Building2, ChevronRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from '../components/Themed';
import { useColorScheme } from 'react-native';

const SERVER_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export default function SetupScreen() {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const { setTenant } = useTenant();
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

  const handleIdentify = async () => {
    if (!slug) {
      Alert.alert('Erro', 'Por favor, digite o código da empresa.');
      return;
    }

    setLoading(true);
    try {
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
      style={[styles.container, { backgroundColor }]}
    >
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Background Glow */}
      <DefaultView style={[styles.glow, { backgroundColor: primaryColor + '20' }]} />

      <DefaultView style={styles.content}>
        <DefaultView style={styles.logoContainer}>
          <DefaultView style={[styles.logoBox, { backgroundColor: primaryColor, shadowColor: primaryColor }]}>
            <Zap color="#fff" size={32} />
          </DefaultView>
        </DefaultView>

        <DefaultText style={[styles.title, { color: textColor }]}>Vendas PRO</DefaultText>
        <DefaultText style={[styles.subtitle, { color: secondaryColor }]}>Gestão e Logística</DefaultText>

        <DefaultView style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
          <DefaultText style={[styles.cardTitle, { color: textColor }]}>Identifique sua Empresa</DefaultText>
          <DefaultText style={[styles.cardDesc, { color: secondaryColor }]}>Digite o código fornecido pelo seu administrador.</DefaultText>

          <DefaultView style={[styles.inputWrapper, { backgroundColor: surfaceColor, borderColor }]}>
            <Building2 size={20} color={placeholderColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder="Código da Empresa"
              placeholderTextColor={placeholderColor}
              value={slug}
              onChangeText={setSlug}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </DefaultView>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: primaryColor }, loading && styles.buttonDisabled]} 
            onPress={handleIdentify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <DefaultText style={styles.buttonText}>Continuar</DefaultText>
                <ChevronRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </DefaultView>

        <DefaultText style={[styles.footer, { color: placeholderColor }]}>© 2026 Vendas PRO. Todos os direitos reservados.</DefaultText>
      </DefaultView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
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
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 48,
  },
  card: {
    width: '100%',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
  },
  button: {
    height: 56,
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
  }
});
