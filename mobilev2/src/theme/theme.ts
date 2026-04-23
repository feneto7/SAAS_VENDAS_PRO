import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const Colors = {
  // Base Colors
  background: '#0F0B1E',
  primary: '#6C47FF',
  primaryDark: '#5D3FD3',
  secondary: '#7C3AED',
  white: '#FFFFFF',
  transparent: 'transparent',
  
  // Semantic UI Tokens
  buttonBg: '#aa95ffff',
  buttonSuccess: '#10B981',
  buttonDanger: '#EF4444',
  buttonWarning: '#F59E0B',
  buttonInfo: '#3B82F6',
  
  // Surface / List Tokens
  cardBg: 'rgba(255,255,255,0.04)',
  cardSolid: '#1E1640',
  cardBorder: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.1)',
  listItemBg: '#6C47FF',
  
  // Text Tokens
  textPrimary: '#FFFFFF',
  textSecondary: '#CFCADA',
  textMuted: '#9B91B9',
  textInput: '#FFFFFF',
  
  // Icon Tokens
  iconPrimary: '#FFFFFF',
  
  // feedback
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Gray scale / Placeholders
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Interactive / Form
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(108, 71, 255, 0.25)',
  iconBg: 'rgba(108, 71, 255, 0.15)',
  iconBorder: 'rgba(108, 71, 255, 0.3)',
};

export const Shadows = {
  black: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primary: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  }
};

export const GlobalStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 80,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.secondary,
    opacity: 0.1,
  },
});

// Centralized UI components (Shared between screens for 100% standardization)
export const UI = {
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.buttonBg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  } as ViewStyle,
  
  actionCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 24,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,

  listItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.listItemBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    marginBottom: 12,
    gap: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  moduleCard: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 140,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,

  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  } as TextStyle,

  input: {
    height: 56,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
  } as TextStyle,
};
