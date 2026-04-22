import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { Building2, ArrowRight, AtSign } from 'lucide-react-native';
import { useAuthStore } from '../../stores/useAuthStore';
import { Colors, GlobalStyles, UI } from '../../theme/theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

export const SelectTenant = ({ onNext }: { onNext: () => void }) => {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const setTenant = useAuthStore((state) => state.setTenant);

  const handleContinue = async () => {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      Alert.alert('Atenção', 'Digite o nome da empresa para continuar.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tenant/info`, {
        headers: { 'x-tenant-slug': normalized },
      });

      if (res.ok) {
        const data = await res.json();
        setTenant({ id: String(data.id || normalized), name: data.name || normalized, slug: normalized });
        onNext();
      } else {
        Alert.alert('Erro', 'Empresa não encontrada. Verifique o nome e tente novamente.');
      }
    } catch (err) {
      Alert.alert('Sem conexão', 'Não foi possível conectar ao servidor para validar a empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={GlobalStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Glow decorativo top */}
      <View style={GlobalStyles.glowTop} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={GlobalStyles.flex}
      >
        <View style={styles.container}>

          <View style={styles.iconContainer}>
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Building2 size={28} color={Colors.iconPrimary} />
              </View>
            </View>
          </View>

          {/* Headline */}
          <View style={styles.headlineBlock}>
            <Text style={styles.tagline}>Vendas Pro</Text>
            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={styles.subtitle}>
              Digite o nome da sua empresa{'\n'}para continuar
            </Text>
          </View>

          {/* Card de input */}
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Nome da Empresa</Text>
            <View style={styles.inputWrapper}>
              <AtSign size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="minha-empresa"
                placeholderTextColor={Colors.textMuted}
                value={slug}
                onChangeText={setSlug}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
                returnKeyType="go"
                onSubmitEditing={handleContinue}
              />
            </View>

            <TouchableOpacity
              style={[UI.button, loading && styles.buttonLoading]}
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continuar</Text>
                  <ArrowRight size={20} color={Colors.white} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            Não sabe o nome da empresa? Fale com seu gestor.
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Glow decorativo bottom */}
      <View style={GlobalStyles.glowBottom} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconOuter: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.iconBorder,
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  headlineBlock: {
    marginBottom: 36,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 24,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
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
    fontSize: 17,
    color: Colors.textInput,
    letterSpacing: 0.3,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
