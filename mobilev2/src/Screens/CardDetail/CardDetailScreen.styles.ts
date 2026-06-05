import { StyleSheet } from 'react-native';
import { Shadows } from '../../theme/theme';

export const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { alignItems: 'center', flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '900', color: colors.white },

  clientBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  clientIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: colors.iconBorder },
  clientLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  clientValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  clientTotal: { fontSize: 16, fontWeight: '900', color: colors.accent },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    padding: 6,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
    ...Shadows.neumorphic(isDark),
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: colors.white,
  },
  footerAction: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  footerTip: {
    fontSize: 10,
    color: colors.danger,
    marginTop: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.neumorphic(isDark),
    elevation: 8,
  }
});
