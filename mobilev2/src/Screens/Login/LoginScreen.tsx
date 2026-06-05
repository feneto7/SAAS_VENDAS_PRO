import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, StatusBar, ScrollView
} from 'react-native';
import { User, Lock, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '../../stores/useAuthStore';
import { getGlobalStyles, getUIStyles } from '../../theme/theme';
import { useTheme } from '../../stores/useThemeStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

export const LoginScreen = ({ onBack }: { onBack: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const tenant = useAuthStore((state) => state.tenant);
  const { colors, isDark } = useTheme();

  const GlobalStyles = useMemo(() => getGlobalStyles(colors), [colors]);
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);

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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={GlobalStyles.flex}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={onBack} style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 1, borderColor: colors.border }}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{tenant?.name}</Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>Acesse sua conta</Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8 }}>Digite suas credenciais de vendedor</Text>
          </View>

          <View style={{ backgroundColor: colors.surfaceRaised, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 24 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '500', marginBottom: 10 }}>Usuário</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: colors.inputBorder, paddingHorizontal: 16, height: 56, marginBottom: 20 }}>
              <User size={20} color={colors.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: colors.textInput }}
                placeholder="seu.usuario"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '500', marginBottom: 10 }}>Senha</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1.5, borderColor: colors.inputBorder, paddingHorizontal: 16, height: 56, marginBottom: 20 }}>
              <Lock size={20} color={colors.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: colors.textInput }}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[UI.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={{ color: colors.white, fontSize: 17, fontWeight: '700', letterSpacing: 0.2 }}>Entrar no Sistema</Text>
                  <ArrowRight size={20} color={colors.white} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
