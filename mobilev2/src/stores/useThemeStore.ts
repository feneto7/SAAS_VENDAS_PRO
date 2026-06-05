import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTokens, darkTokens } from '../theme/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean; // Computed active state
  setMode: (mode: ThemeMode) => void;
  // This is a helper to manually toggle between light/dark for quick tests
  toggleTheme: () => void; 
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'dark', // Padrão inicial
      isDark: true,
      
      setMode: (mode: ThemeMode) => {
        // Here we could implement system detection using Appearance.getColorScheme() 
        // For simplicity, we resolve 'system' as dark for now, but we can expand this.
        const isDark = mode === 'dark' || (mode === 'system' && true /* fallback */);
        set({ mode, isDark });
      },
      
      toggleTheme: () => {
        const currentIsDark = get().isDark;
        set({ 
          mode: currentIsDark ? 'light' : 'dark',
          isDark: !currentIsDark 
        });
      },
    }),
    {
      name: 'vendaspro-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Helper hook to get the active colors based on current mode
 */
export const useTheme = () => {
  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const colors = isDark ? darkTokens : lightTokens;
  return { colors, isDark, toggleTheme };
};
