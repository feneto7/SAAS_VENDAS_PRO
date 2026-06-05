import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { getGlobalStyles, getUIStyles, Shadows } from '../../theme/theme';
import { useTheme } from '../../stores/useThemeStore';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  ChevronLeft, FileBarChart2, TrendingUp, 
  Users, CreditCard, CheckCircle, Clock, AlertTriangle, WifiOff
} from 'lucide-react-native';

interface ReportData {
  collection: any;
  previousCollection: any;
  metrics: {
    newClients: number;
    pendingCards: number;
    paidCards: number;
    newCards: number;
    totalReceived: number;
    receivedByMethod: { method: string, amount: number }[];
    servedClients: number;
    unservedClients: number;
    totalNewCardsCC: number;
    totalNewCardsSC: number;
  };
  snapshots: any[];
}

export const ChargeReportScreen = () => {
  const { goBack, currentParams } = useNavigationStore();
  const { chargeId, chargeCode, routeName } = currentParams || {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { colors, isDark } = useTheme();
  const GlobalStyles = useMemo(() => getGlobalStyles(colors), [colors]);
  const UI = useMemo(() => getUIStyles(colors, isDark), [colors, isDark]);
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = useAuthStore.getState().token;
      const tenantSlug = useAuthStore.getState().tenant?.slug;
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.3.5:3001';

      if (!token || !tenantSlug) {
        throw new Error('Usuário não autenticado');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${API_URL}/api/collections/${chargeId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': tenantSlug
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error('Falha ao carregar relatório');
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Report error:', err);
      setError(err.name === 'AbortError' 
        ? 'A conexão expirou. Verifique sua internet.' 
        : 'Não foi possível carregar o relatório. Verifique sua conexão com a internet.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.stateText}>Gerando relatório...</Text>
        </View>
      );
    }

    if (error || !data) {
      return (
        <View style={styles.centerState}>
          <WifiOff size={48} color={colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={UI.button} onPress={loadReport}>
            <Text style={styles.retryText}>TENTAR NOVAMENTE</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const m = data.metrics;

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Main Financial Highlight */}
        <View style={styles.highlightCard}>
          <View style={styles.highlightHeader}>
            <TrendingUp color={colors.white} size={24} />
            <Text style={styles.highlightTitle}>Resumo Financeiro</Text>
          </View>
          
          <View style={styles.highlightBody}>
            <Text style={styles.highlightLabel}>Total Recebido</Text>
            <Text style={styles.highlightValue}>{formatCurrency(m.totalReceived)}</Text>
            
            {m.receivedByMethod && m.receivedByMethod.length > 0 && (
              <View style={styles.methodsList}>
                {m.receivedByMethod.map((item, idx) => (
                  <View key={idx} style={styles.methodRow}>
                    <Text style={styles.methodName}>{item.method}</Text>
                    <Text style={styles.methodAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Fichas Novas Finance */}
        <View style={styles.secondaryHighlightCard}>
          <Text style={styles.secondaryHighlightTitle}>Vendas de Fichas Novas</Text>
          <View style={styles.secondaryHighlightRow}>
            <View style={styles.secondaryHighlightCol}>
              <Text style={styles.secondaryHighlightLabel}>Total CC</Text>
              <Text style={[styles.secondaryHighlightValue, { color: colors.accent }]}>{formatCurrency(m.totalNewCardsCC || 0)}</Text>
            </View>
            <View style={styles.secondaryHighlightCol}>
              <Text style={styles.secondaryHighlightLabel}>Total SC</Text>
              <Text style={[styles.secondaryHighlightValue, { color: colors.info }]}>{formatCurrency(m.totalNewCardsSC || 0)}</Text>
            </View>
          </View>
          <View style={styles.secondaryHighlightDivider} />
          <View style={styles.secondaryHighlightRow}>
            <View style={styles.secondaryHighlightCol}>
              <Text style={styles.secondaryHighlightLabel}>Total Geral (CC + SC)</Text>
              <Text style={[styles.secondaryHighlightValue, { color: colors.success }]}>
                {formatCurrency((m.totalNewCardsCC || 0) + (m.totalNewCardsSC || 0))}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Métricas de Produtividade</Text>
        
        {/* Productivity Grid */}
        <View style={styles.grid}>
          
          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.accent + '20' }]}>
              <Users color={colors.accent} size={20} />
            </View>
            <Text style={styles.metricValue}>{m.newClients}</Text>
            <Text style={styles.metricLabel}>Novos Clientes</Text>
          </View>
          
          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.success + '20' }]}>
              <CheckCircle color={colors.success} size={20} />
            </View>
            <Text style={styles.metricValue}>{m.servedClients}</Text>
            <Text style={styles.metricLabel}>Clientes Atendidas</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.danger + '20' }]}>
              <AlertTriangle color={colors.danger} size={20} />
            </View>
            <Text style={styles.metricValue}>{m.unservedClients}</Text>
            <Text style={styles.metricLabel}>Não Atendidas</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.info + '20' }]}>
              <CreditCard color={colors.info} size={20} />
            </View>
            <Text style={styles.metricValue}>{m.newCards}</Text>
            <Text style={styles.metricLabel}>Fichas Geradas</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.success + '20' }]}>
              <CheckCircle color={colors.success} size={20} />
            </View>
            <Text style={styles.metricValue}>{m.paidCards}</Text>
            <Text style={styles.metricLabel}>Fichas Pagas</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconBox, { backgroundColor: colors.warning + '20' }]}>
              <Clock color={colors.warning} size={20} />
            </View>
            <Text style={styles.metricValue}>{m.pendingCards}</Text>
            <Text style={styles.metricLabel}>Fichas Pendentes</Text>
          </View>

        </View>

        {data.snapshots && data.snapshots.length > 0 && (
          <View style={styles.warningBox}>
             <AlertTriangle color={colors.warning} size={20} />
             <Text style={styles.warningText}>
               Há {data.snapshots.length} registros de movimentação de estoque finalizados nesta cobrança.
             </Text>
          </View>
        )}

      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={GlobalStyles.root}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={goBack} 
            style={styles.backBtn} 
            activeOpacity={0.7}
          >
            <ChevronLeft color={colors.textPrimary} size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.title}>Relatório #{chargeCode || '---'}</Text>
            <Text style={styles.subtitle}>{routeName || 'Rota'}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 24 
  },
  backBtn: { 
    width: 44, height: 44, borderRadius: 14, 
    backgroundColor: colors.surface, borderWidth: 1, 
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center' 
  },
  headerTitleBox: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateText: { fontSize: 16, color: colors.textSecondary, marginTop: 16, fontWeight: '600' },
  errorText: { fontSize: 15, color: colors.textPrimary, marginTop: 16, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  retryText: { color: colors.white, fontWeight: '800', letterSpacing: 1 },

  scrollContent: { paddingBottom: 40 },
  
  highlightCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.neumorphic(isDark),
  },
  highlightHeader: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  highlightTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  highlightBody: {
    padding: 24,
  },
  highlightLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  highlightValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1
  },
  methodsList: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  methodName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  methodAmount: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '800'
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.5
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16
  },
  metricCard: {
    width: '47%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.neumorphic(isDark),
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 20
  },
  
  secondaryHighlightCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryHighlightTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  secondaryHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryHighlightCol: {
    flex: 1,
  },
  secondaryHighlightLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  secondaryHighlightValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  secondaryHighlightDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  
  warningBox: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '15',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning + '40',
    gap: 12
  },
  warningText: {
    flex: 1,
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18
  }
});
