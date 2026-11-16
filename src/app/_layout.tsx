import { useEffect } from 'react';

import { Redirect, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { I18nProvider } from '@/i18n';

// On garde l'écran de démarrage affiché tant que la police n'est pas prête.
SplashScreen.preventAutoHideAsync().catch(() => {});

function Guard() {
  const { phone, ready } = useAuth();
  const segments = useSegments();
  const first = (segments[0] as string | undefined) ?? '';
  const isPublic = first === 'welcome' || first === 'login';

  if (!ready) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {!phone && !isPublic ? <Redirect href={'/welcome' as never} /> : null}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // On ne bloque pas l'app si la police échoue : on garde la police système.
  const appReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync().catch(() => {});
  }, [appReady]);

  if (!appReady) return null;

  return (
    <I18nProvider>
      <AuthProvider>
        <Guard />
      </AuthProvider>
    </I18nProvider>
  );
}
