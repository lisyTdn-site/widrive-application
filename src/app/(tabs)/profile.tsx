import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, font } from '@/theme';
import { useAuth } from '@/auth/AuthContext';
import { LANGS, useI18n } from '@/i18n';
import { countries } from '@/config/countries';

function Row({ icon, label, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [s.row, pressed && onPress ? s.pressed : null]}
    >
      <View style={s.icon}><Ionicons name={icon} size={18} color={colors.accent} /></View>
      <Text style={s.rowLabel}>{label}</Text>
      {value ? <Text style={s.rowValue} numberOfLines={1}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

export default function Profile() {
  const { user, signOut, rememberOn, setRemember } = useAuth();
  const { t, tr, lang, setLang } = useI18n();
  const country = countries.find((c) => c.code === user?.country);
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const confirmOut = () =>
    Alert.alert(t('pf.signOut'), t('pf.signOutAsk'), [
      { text: t('pf.cancel'), style: 'cancel' },
      { text: t('pf.signOut'), style: 'destructive', onPress: () => { signOut(); router.replace('/welcome' as never); } },
    ]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.header}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <Text style={s.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={s.phone}>+{user?.phone}</Text>
        </View>

        <Text style={s.section}>{t('pf.account')}</Text>
        <View style={s.card}>
          <Row icon="call-outline" label={t('pf.phone')} value={`+${user?.phone ?? ''}`} />
          <Row icon="mail-outline" label={t('pf.email')} value={user?.email || '—'} />
          <Row icon="flag-outline" label={t('pf.country')} value={country ? `${country.flag} ${tr(country.name)}` : '—'} />
        </View>

        <Text style={s.section}>{t('pf.settings')}</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.icon}><Ionicons name="language-outline" size={18} color={colors.accent} /></View>
            <Text style={s.rowLabel}>{t('pf.language')}</Text>
            <View style={s.langs}>
              {LANGS.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => setLang(l.id)}
                  accessibilityRole="button"
                  style={({ pressed }) => [s.lang, l.id === lang && s.langOn, pressed && s.pressed]}
                >
                  <Text style={[s.langText, l.id === lang && { color: colors.white }]}>{l.id.toUpperCase()}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={s.row}>
            <View style={s.icon}><Ionicons name="phone-portrait-outline" size={18} color={colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabelPlain}>{t('pf.remember')}</Text>
              <Text style={s.hint}>{t('pf.rememberHint')}</Text>
            </View>
            <Switch value={rememberOn} onValueChange={setRemember} trackColor={{ true: colors.accent }} />
          </View>
          <Row icon="help-buoy-outline" label={t('pf.help')} onPress={() => router.push('/assistance' as never)} />
        </View>

        <Pressable
          onPress={confirmOut}
          accessibilityRole="button"
          style={({ pressed }) => [s.out, pressed && s.pressed]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.accent} />
          <Text style={s.outText}>{t('pf.signOut')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, alignItems: 'center', paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 4 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarText: { color: colors.white, fontSize: 28, fontFamily: font.extrabold },
  name: { color: colors.white, fontSize: 20, fontFamily: font.extrabold },
  phone: { color: colors.onDark, fontSize: 14 },
  section: { fontSize: 15, fontFamily: font.extrabold, color: colors.textMuted, marginHorizontal: 16, marginTop: 20, marginBottom: 4, textTransform: 'uppercase' },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginHorizontal: 16, marginTop: 8, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: font.bold, color: colors.primary },
  rowLabelPlain: { fontSize: 15, fontFamily: font.bold, color: colors.primary },
  rowValue: { fontSize: 14, color: colors.textMuted, maxWidth: 160 },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  langs: { flexDirection: 'row', gap: 6 },
  lang: { paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  langOn: { backgroundColor: colors.primary },
  langText: { fontSize: 12, fontFamily: font.extrabold, color: colors.textMuted },
  out: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, marginHorizontal: 16, marginTop: 24, borderRadius: 26, borderWidth: 1.5, borderColor: colors.accent },
  outText: { color: colors.accent, fontFamily: font.extrabold, fontSize: 15 },
  pressed: { opacity: 0.7 },
});