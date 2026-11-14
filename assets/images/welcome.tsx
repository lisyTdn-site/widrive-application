import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Redirect, router } from 'expo-router';
import { colors } from '@/theme/colors';
import { useAuth } from '@/auth/AuthContext';

export default function Welcome() {
  const { phone } = useAuth();
  if (phone) return <Redirect href={'/' as never} />;

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="light" />
      <View style={s.circleBig} />
      <View style={s.circleSmall} />

      <View style={s.center}>
        <View style={s.logoCard}>
          <Image source={require('@/assets/images/logo.jpg')} style={s.logo} resizeMode="contain" />
        </View>

        <Text style={s.title}>Votre vision,{'\n'}notre mouvement.</Text>
        <Text style={s.sub}>Construisons l’avenir, ensemble.</Text>
      </View>

      <View style={s.bottom}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/login' as never)}
          style={s.cta}
        >
          <Text style={s.ctaText}>DÉMARRER MAINTENANT</Text>
        </Pressable>
        <Text style={s.legal}>Véhicules · Logement · Crypto · Cartes · Chauffeur</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary, overflow: 'hidden' },
  circleBig: {
    position: 'absolute', top: -90, right: -90, width: 260, height: 260, borderRadius: 130,
    backgroundColor: colors.accent,
  },
  circleSmall: {
    position: 'absolute', bottom: 120, left: -70, width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#2A2F36',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14 },
  logoCard: {
    backgroundColor: '#fff', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 18,
  },
  logo: { width: 250, height: 98 },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '800', color: '#fff', textAlign: 'center' },
  sub: { fontSize: 15, color: colors.onDark, textAlign: 'center' },
  bottom: { padding: 24, gap: 14 },
  cta: {
    height: 58, borderRadius: 29, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  legal: { fontSize: 12, color: colors.onDark, textAlign: 'center' },
});