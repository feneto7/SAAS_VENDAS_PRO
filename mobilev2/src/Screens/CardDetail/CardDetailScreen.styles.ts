import { StyleSheet } from 'react-native';
import { Colors, Shadows, UI } from '../../theme/theme';

export const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitleBox: { alignItems: 'center', flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.white, letterSpacing: 0.5, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '900', color: Colors.white },

  clientBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  clientIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clientLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  clientValue: { fontSize: 15, fontWeight: '800', color: Colors.white },
  clientTotal: { fontSize: 16, fontWeight: '900', color: Colors.primary },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    padding: 6,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    ...Shadows.black,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: Colors.white,
  },
  footerAction: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  buttonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  footerTip: {
    fontSize: 10,
    color: Colors.danger,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.black,
    elevation: 8,
  }
});
