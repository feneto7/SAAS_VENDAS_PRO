import { StyleSheet } from 'react-native';

export const darkTokens = {
  // Base Surfaces
  background: '#1e2028',
  surface: '#252830',
  surfaceRaised: '#2a2d38',
  surfaceDeep: '#191b22',
  
  // Semantic & Accents
  primary: '#6C47FF',
  primaryDark: '#5D3FD3',
  secondary: '#7C3AED',
  accent: '#00e5c8',
  white: '#FFFFFF',
  transparent: 'transparent',
  
  // Neumorphic Shadows (Native Approximation)
  shadowDark: '#13151c',
  shadowLight: '#313748',
  
  // Text Tokens
  textPrimary: '#e8eaf0',
  textSecondary: '#9096b0',
  textMuted: '#5a607a',
  textInput: '#e8eaf0',
  
  // Feedback
  success: '#00e5c8',
  danger: '#ff6b7a',
  warning: '#ffd166',
  info: '#74b9ff',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.06)',
  borderAccent: 'rgba(0, 229, 200, 0.35)',
  borderSubtle: 'rgba(255, 255, 255, 0.03)',
  borderLight: 'rgba(255,255,255,0.1)',
  
  // Specific UI mappings (Legacy fallback mapped to neumorphic)
  buttonBg: '#00e5c8',
  buttonText: '#191b22',
  buttonSuccess: '#00e5c8',
  cardBg: '#252830',
  cardSolid: '#2a2d38',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  listItemBg: '#2a2d38',
  inputBg: '#191b22',
  inputBorder: 'rgba(255, 255, 255, 0.03)',
  iconBg: 'rgba(0, 229, 200, 0.1)',
  iconBorder: 'rgba(0, 229, 200, 0.2)',
};

export const lightTokens = {
  // Base Surfaces
  background: '#e6e9ef',
  surface: '#e6e9ef',
  surfaceRaised: '#f0f2f7',
  surfaceDeep: '#d9dde6',
  
  // Semantic & Accents
  primary: '#6c5ce7',
  primaryDark: '#5548c8',
  secondary: '#a29bfe',
  accent: '#6c5ce7',
  white: '#FFFFFF',
  transparent: 'transparent',
  
  // Neumorphic Shadows (Native Approximation)
  shadowDark: 'rgba(152, 165, 186, 0.65)',
  shadowLight: 'rgba(255, 255, 255, 0.95)',
  
  // Text Tokens
  textPrimary: '#2d3142',
  textSecondary: '#5a607a',
  textMuted: '#8c93ab',
  textInput: '#2d3142',
  
  // Feedback
  success: '#059669',
  danger: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  
  // Borders
  border: 'rgba(152, 165, 186, 0.2)',
  borderAccent: 'rgba(108, 92, 231, 0.35)',
  borderSubtle: 'rgba(152, 165, 186, 0.1)',
  borderLight: 'rgba(152, 165, 186, 0.2)',
  
  // Specific UI mappings (Legacy fallback mapped to neumorphic)
  buttonBg: '#6c5ce7',
  buttonText: '#FFFFFF',
  buttonSuccess: '#059669',
  cardBg: '#e6e9ef',
  cardSolid: '#f0f2f7',
  cardBorder: 'rgba(152, 165, 186, 0.2)',
  listItemBg: '#f0f2f7',
  inputBg: '#d9dde6',
  inputBorder: 'rgba(152, 165, 186, 0.1)',
  iconBg: 'rgba(108, 92, 231, 0.1)',
  iconBorder: 'rgba(108, 92, 231, 0.2)',
};

// Aliasing type for colors
export type ThemeColors = typeof darkTokens;

// We export the default Colors just for smooth migration (points to dark)
// But screens should use useTheme().colors instead.

export const Shadows = {
  neumorphic: (isDark: boolean) => ({
    shadowColor: isDark ? '#000' : '#8a95a5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.4 : 0.25,
    shadowRadius: 12,
    elevation: 8,
  }),
  flat: (isDark: boolean) => ({
    shadowColor: isDark ? '#000' : '#8a95a5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.15,
    shadowRadius: 4,
    elevation: 3,
  }),
  black: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primary: (colors: ThemeColors) => ({
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  }),
};

// Hook/Function to generate global styles dynamically
export const getGlobalStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
});

export const getUIStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.buttonBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.neumorphic(isDark),
  },
  actionCard: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
    ...Shadows.neumorphic(isDark),
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    gap: 16,
    ...Shadows.flat(isDark),
  },
  input: {
    height: 56,
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.textInput,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
});



