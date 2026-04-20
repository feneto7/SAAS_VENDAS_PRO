const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export const ThemeColors = {
  light: {
    text: '#0f172a', // Slate 900
    background: '#ffffff',
    tint: tintColorLight,
    tabIconDefault: '#94a3b8', // Slate 400
    tabIconSelected: tintColorLight,
    primary: '#3b82f6', // Bright Blue
    secondary: '#64748b', // Slate 500
    surface: '#f8fafc', // Slate 50
    border: '#e2e8f0', // Slate 200
    error: '#ef4444', // Red 500
    success: '#10b981', // Emerald 500
    warning: '#f59e0b', // Amber 500
    icon: '#64748b',
    placeholder: '#94a3b8',
    card: '#ffffff',
  },
  dark: {
    text: '#f8fafc', // Slate 50
    background: '#000000',
    tint: tintColorDark,
    tabIconDefault: '#475569', // Slate 600
    tabIconSelected: tintColorDark,
    primary: '#60a5fa', // Lighter Blue for Dark Mode
    secondary: '#94a3b8', // Slate 400
    surface: '#0f172a', // Slate 900
    border: '#1e293b', // Slate 800
    error: '#f87171', // Red 400
    success: '#34d399', // Emerald 400
    warning: '#fbbf24', // Amber 400
    icon: '#94a3b8',
    placeholder: '#475569',
    card: '#0c0c0c',
  },
};

export default ThemeColors;
