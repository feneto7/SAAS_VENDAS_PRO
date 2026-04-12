import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { TenantProvider, useTenant } from '../lib/TenantContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'setup',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <TenantProvider>
      <RootLayoutNavWrapper />
    </TenantProvider>
  );
}

function RootLayoutNavWrapper() {
  const { tenantSlug, seller, token, activeTrip, loading: tenantLoading } = useTenant();
  const segments = useSegments();
  const router = useRouter();
  const hasResumed = useRef(false);

  useEffect(() => {
    if (tenantLoading) return;

      const inAuthGroup = segments[0] === '(main)';
      const inSetup = segments[0] === 'setup';
      const inLogin = segments[0] === 'login';

      if (!tenantSlug && !inSetup) {
        hasResumed.current = false;
        router.replace('/setup');
      } else if (tenantSlug && !token && !inLogin) {
        hasResumed.current = false;
        router.replace('/login');
      } else if (tenantSlug && token) {
        // Logged in. Check for active trip persistence.
        const isActiveTripRoute = (segments as any[]).includes('collection-detail');
        const isAtRoot = (segments as any[]).length === 0 || ((segments as any[]).length === 1 && segments[0] === '(main)');
        
        if (activeTrip && !isActiveTripRoute && isAtRoot && !hasResumed.current) {
           hasResumed.current = true;
           router.replace(`/(main)/collection-detail/${activeTrip.id}` as any);
        } else if ((inLogin || inSetup) && !activeTrip) {
          router.replace('/');
        }
      }
    }, [tenantSlug, seller, token, activeTrip, tenantLoading, segments]);

  if (tenantLoading) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="setup" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(main)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
