import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, StatusBar, ScrollView
} from 'react-native';
import { User, Lock, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../stores/useAuthStore';
import { Colors, GlobalStyles, UI } from '../../theme/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

export const LoginScreen = ({ onBack }: { onBack: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const tenant = useAuthStore((state) => state.tenant);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erro', 'Preencha usuário e senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/seller/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenant?.slug || '',
        },
        body: JSON.stringify({ appCode: username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuth({ 
          id: data.user.id, 
          name: data.user.name, 
          sellerCode: data.user.code || data.user.sellerCode 
        }, data.token);
      } else {
        Alert.alert('Erro no login', data.message || 'Credenciais inválidas.');
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={GlobalStyles.glowTop} pointerEvents="none" />
      <View style={GlobalStyles.glowBottom} pointerEvents="none" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={GlobalStyles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headlineBlock}>
            <Text style={styles.tagline}>{tenant?.name}</Text>
            <Text style={styles.title}>Acesse sua conta</Text>
            <Text style={styles.subtitle}>Digite suas credenciais de vendedor</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.inputLabel}>Usuário</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu.usuario"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[UI.button, loading && styles.buttonLoading]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Entrar no Sistema</Text>
                  <ArrowRight size={20} color={Colors.white} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headlineBlock: {
    marginBottom: 40,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textInput,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  footer: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 24,
  },
});
