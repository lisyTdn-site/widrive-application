import { Redirect, Stack, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { I18nProvider } from '@/i18n';

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
  return (
    <I18nProvider>
      <AuthProvider>
        <Guard />
      </AuthProvider>
    </I18nProvider>
  );
}