import { useEffect, useState } from 'react';
import {
  Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { colors, font } from '@/theme';
import { useAuth, type AuthError } from '@/auth/AuthContext';
import { useI18n, type Key } from '@/i18n';
import { LangSwitch } from '@/components/LangSwitch';
import { PinInput } from '@/components/PinInput';
import { activeCountries, countries, DEFAULT_COUNTRY, type Country } from '@/config/countries';

type Mode = 'login' | 'register' | 'reset';
type Step = 'form' | 'otp';

const onlyDigits = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, style, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textMuted} style={[s.input, style]} {...rest} />
    </View>
  );
}

export default function Login() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const { phone: loggedPhone, remembered, register, login, resetPin } = useAuth();
  const { t, tr } = useI18n();

  const startCountry = countries.find((c) => c.code === remembered?.country) ?? DEFAULT_COUNTRY;

  const [mode, setMode] = useState<Mode>(params.tab === 'register' ? 'register' : 'login');
  const [step, setStep] = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState<Country>(startCountry);
  const [pickCountry, setPickCountry] = useState(false);
  const [phone, setPhone] = useState(remembered ? remembered.phone.slice(startCountry.dial.length) : '');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  if (loggedPhone) return <Redirect href={'/' as never} />;

  const full = country.dial + phone;
  const errText = (e: AuthError) => t(`err.${e}` as Key);
  const fail = (msg: string) => setError(msg);

  const changeMode = (m: Mode) => {
    setMode(m);
    setStep('form');
    setError('');
    setInfo('');
    setCode('');
    setPin('');
    setPin2('');
  };

  const goOtp = () => {
    setError('');
    setCode('');
    setCount(30);
    setStep('otp');
  };

  const submitLogin = async () => {
    if (phone.length !== country.phoneLength) return fail(t('err.phone', { n: country.phoneLength }));
    if (pin.length !== 4) return fail(t('err.pin'));
    setBusy(true);
    const r = await login(full, pin, remember);
    setBusy(false);
    if (!r.ok) fail(errText(r.error));
  };

  const submitRegister = () => {
    if (firstName.trim().length < 2) return fail(t('err.firstName'));
    if (lastName.trim().length < 2) return fail(t('err.lastName'));
    if (email.trim() && !EMAIL.test(email.trim())) return fail(t('err.email'));
    if (phone.length !== country.phoneLength) return fail(t('err.phone', { n: country.phoneLength }));
    if (pin.length !== 4) return fail(t('err.pin'));
    if (pin !== pin2) return fail(t('err.pinMatch'));
    if (!terms) return fail(t('err.terms'));
    goOtp();
  };

  // Réinitialisation indisponible tant que la vérification SMS n'est pas branchée (cf. AuthContext).
  const submitReset = () => fail(t('err.resetunavailable'));

  const verifyOtp = async () => {
    if (code !== '123456') return fail(t('err.otp'));
    setBusy(true);
    if (mode === 'register') {
      const r = await register(
        { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), country: country.code, phone: full, pin },
        remember
      );
      setBusy(false);
      if (!r.ok) {
        fail(errText(r.error));
        setStep('form');
        return;
      }
      // Compte créé : on renvoie l'utilisateur vers la connexion pour qu'il
      // ressaisisse son code PIN et le mémorise.
      changeMode('login');
      setInfo(t('auth.accountCreated'));
    } else {
      const r = await resetPin(full, pin);
      setBusy(false);
      if (!r.ok) {
        fail(errText(r.error));
        setStep('form');
        return;
      }
      changeMode('login');
      setInfo(t('auth.resetDone'));
    }
  };

  const phoneField = (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{t('auth.phone')}</Text>
      <View style={s.phoneRow}>
        <Pressable
          disabled={activeCountries.length < 2}
          onPress={() => setPickCountry(true)}
          style={s.prefix}
          accessibilityLabel={t('auth.selectCountry')}
        >
          <Text style={s.prefixText}>{country.flag} {country.dial}</Text>
          {activeCountries.length > 1 ? <Ionicons name="chevron-down" size={16} color={colors.primary} /> : null}
        </Pressable>
        <TextInput
          value={phone}
          onChangeText={(v) => { setPhone(onlyDigits(v, country.phoneLength)); setError(''); }}
          keyboardType="number-pad"
          placeholder={'0'.repeat(country.phoneLength)}
          placeholderTextColor={colors.textMuted}
          style={[s.input, { flex: 1 }]}
        />
      </View>
    </View>
  );

  const rememberRow = (
    <Pressable onPress={() => setRemember(!remember)} style={s.checkRow}>
      <Ionicons name={remember ? 'checkbox' : 'square-outline'} size={24} color={remember ? colors.accent : colors.textMuted} />
      <Text style={s.checkText}>{t('auth.remember')}</Text>
    </Pressable>
  );

  const cta = (label: string, onPress: () => void) => (
    <Pressable
      disabled={busy}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [s.cta, (busy || pressed) && s.pressed]}
    >
      <Text style={s.ctaText}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <View style={s.headerTop}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [s.back, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
              >
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </Pressable>
              <LangSwitch />
            </View>
            <View style={s.logoPill}>
              <Image source={require('@/assets/images/logo.jpg')} style={s.logo} resizeMode="contain" />
            </View>
            <Text style={s.hello}>{mode === 'reset' ? t('auth.resetTitle') : t('auth.welcome')}</Text>
            {mode !== 'reset' ? <Text style={s.helloSub}>{t('auth.welcomeSub')}</Text> : null}
          </View>

          <View style={s.card}>
            {mode !== 'reset' && step === 'form' ? (
              <View style={s.tabs}>
                {(['login', 'register'] as const).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => changeMode(m)}
                    accessibilityRole="button"
                    style={({ pressed }) => [s.tab, mode === m && s.tabOn, pressed && s.pressed]}
                  >
                    <Text style={[s.tabText, mode === m && s.tabTextOn]}>
                      {m === 'login' ? t('auth.tabLogin') : t('auth.tabRegister')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {step === 'otp' ? (
              <>
                <Text style={s.otpTitle}>{t('otp.title')}</Text>
                <Text style={s.otpSub}>{t('otp.sub', { phone: full })}</Text>
                <TextInput
                  value={code}
                  onChangeText={(v) => { setCode(onlyDigits(v, 6)); setError(''); }}
                  keyboardType="number-pad"
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  style={[s.input, s.otpInput]}
                />
                {error ? <Text style={s.error}>{error}</Text> : null}
                {cta(t('otp.validate'), verifyOtp)}
                <Pressable disabled={count > 0} onPress={() => setCount(30)}>
                  <Text style={s.switch}>{count > 0 ? t('otp.resendIn', { s: count }) : t('otp.resend')}</Text>
                </Pressable>
                <Pressable onPress={() => { setStep('form'); setError(''); }}>
                  <Text style={s.switch}>{t('otp.edit')}</Text>
                </Pressable>
              </>
            ) : null}

            {step === 'form' && mode === 'login' ? (
              <>
                {info ? <Text style={s.info}>{info}</Text> : null}
                {phoneField}
                <PinInput
                  label={t('auth.pin')}
                  value={pin}
                  onChange={(v) => { setPin(v); setError(''); }}
                  autoFocus={!!remembered}
                />
                {rememberRow}
                <Pressable onPress={() => changeMode('reset')}>
                  <Text style={s.forgot}>{t('auth.forgot')}</Text>
                </Pressable>
                {error ? <Text style={s.error}>{error}</Text> : null}
                {cta(t('auth.loginCta'), submitLogin)}
                <Pressable onPress={() => changeMode('register')}>
                  <Text style={s.switch}>
                    {t('auth.noAccount')}<Text style={s.switchBold}>{t('auth.signUpLink')}</Text>
                  </Text>
                </Pressable>
              </>
            ) : null}

            {step === 'form' && mode === 'register' ? (
              <>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Field label={t('auth.firstName')} value={firstName} onChangeText={(v) => { setFirstName(v); setError(''); }} autoCapitalize="words" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label={t('auth.lastName')} value={lastName} onChangeText={(v) => { setLastName(v); setError(''); }} autoCapitalize="words" />
                  </View>
                </View>
                <Field
                  label={t('auth.email')}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {phoneField}
                <PinInput label={t('auth.pinChoose')} value={pin} onChange={(v) => { setPin(v); setError(''); }} />
                <PinInput label={t('auth.pinConfirm')} value={pin2} onChange={(v) => { setPin2(v); setError(''); }} />
                {rememberRow}
                <Pressable onPress={() => { setTerms(!terms); setError(''); }} style={s.checkRow}>
                  <Ionicons name={terms ? 'checkbox' : 'square-outline'} size={24} color={terms ? colors.accent : colors.textMuted} />
                  <Text style={s.checkText}>{t('auth.terms')}</Text>
                </Pressable>
                {error ? <Text style={s.error}>{error}</Text> : null}
                {cta(t('auth.registerCta'), submitRegister)}
                <Pressable onPress={() => changeMode('login')}>
                  <Text style={s.switch}>
                    {t('auth.haveAccount')}<Text style={s.switchBold}>{t('auth.signInLink')}</Text>
                  </Text>
                </Pressable>
              </>
            ) : null}

            {step === 'form' && mode === 'reset' ? (
              <>
                {phoneField}
                <PinInput label={t('auth.pinNew')} value={pin} onChange={(v) => { setPin(v); setError(''); }} />
                <PinInput label={t('auth.pinConfirm')} value={pin2} onChange={(v) => { setPin2(v); setError(''); }} />
                {error ? <Text style={s.error}>{error}</Text> : null}
                {cta(t('auth.resetCta'), submitReset)}
                <Pressable onPress={() => changeMode('login')}>
                  <Text style={s.switch}>{t('auth.backToLogin')}</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickCountry} transparent animationType="fade" onRequestClose={() => setPickCountry(false)}>
        <Pressable style={s.overlay} onPress={() => setPickCountry(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>{t('auth.selectCountry')}</Text>
            {activeCountries.map((c) => (
              <Pressable
                key={c.code}
                onPress={() => { setCountry(c); setPhone(''); setPickCountry(false); }}
                style={s.countryRow}
              >
                <Text style={s.countryText}>{c.flag}  {tr(c.name)}  ({c.dial})</Text>
                {c.code === country.code ? <Ionicons name="checkmark" size={20} color={colors.accent} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 18, paddingHorizontal: 16, gap: 6 },
  headerTop: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  logoPill: { backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  logo: { width: 150, height: 58 },
  hello: { fontSize: 24, fontFamily: font.extrabold, color: colors.primary },
  helloSub: { fontSize: 14, color: colors.textMuted },
  card: { flex: 1, padding: 22, gap: 12, minHeight: 460 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 4 },
  tab: { flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: colors.primary },
  tabText: { fontSize: 15, fontFamily: font.extrabold, color: colors.textMuted },
  tabTextOn: { color: colors.white },
  label: { fontSize: 13, fontFamily: font.bold, color: colors.textMuted },
  input: { height: 52, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, fontSize: 16, color: colors.primary },
  phoneRow: { flexDirection: 'row', gap: 8 },
  prefix: { height: 52, paddingHorizontal: 12, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 4 },
  prefixText: { fontSize: 16, fontFamily: font.extrabold, color: colors.primary },
  error: { color: colors.accent, fontSize: 13, fontFamily: font.bold },
  info: { color: colors.success, fontSize: 13, fontFamily: font.bold },
  forgot: { color: colors.accent, fontSize: 13, fontFamily: font.bold, textAlign: 'right' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  cta: { height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  ctaText: { color: colors.white, fontSize: 15, fontFamily: font.extrabold, letterSpacing: 1 },
  switch: { textAlign: 'center', color: colors.textMuted, fontSize: 14, marginTop: 6 },
  switchBold: { color: colors.accent, fontFamily: font.extrabold },
  otpTitle: { fontSize: 20, fontFamily: font.extrabold, color: colors.primary },
  otpSub: { fontSize: 14, color: colors.textMuted },
  otpInput: { textAlign: 'center', fontSize: 26, fontFamily: font.extrabold, letterSpacing: 8 },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, gap: 4 },
  sheetTitle: { fontSize: 17, fontFamily: font.extrabold, color: colors.primary, marginBottom: 8 },
  countryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  countryText: { fontSize: 16, color: colors.primary, fontFamily: font.semibold },
  pressed: { opacity: 0.7 },
});