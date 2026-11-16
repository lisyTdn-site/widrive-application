import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '@/i18n';
import { colors, font } from '@/theme';

const steps = ['trip.step1', 'trip.step2', 'trip.step3'] as const;
const titles = ['trip.title1', 'trip.title2', 'trip.title3'] as const;
const etas = ['5 min', '4 min', 'Maintenant'];

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function Trip() {
  const { t } = useI18n();
  const { cat, pay, price, to } = useLocalSearchParams<{ cat?: string; pay?: string; price?: string; to?: string }>();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= steps.length - 1) return;
    const t = setTimeout(() => setStep((v) => v + 1), 4000); // simulation
    return () => clearTimeout(t);
  }, [step]);

  const cancel = () =>
    Alert.alert(t('trip.cancelAsk'), t('trip.cancelText'), [
      { text: t('trip.no'), style: 'cancel' },
      { text: t('trip.yesCancel'), style: 'destructive', onPress: () => router.replace('/') },
    ]);

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={s.map}>
        <Ionicons name="navigate-outline" size={40} color={colors.textMuted} />
        <Text style={s.mapText}>{t('trip.map')}</Text>
      </View>

      <View style={s.sheet}>
        <View style={s.titleRow}>
          <Text style={s.title}>{t(titles[step])}</Text>
          <View style={s.eta}><Text style={s.etaText}>{step === 2 ? t('trip.now') : etas[step]}</Text></View>
        </View>

        <View style={s.steps}>
          {steps.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <View key={label} style={s.step}>
                <View style={[s.stepDot, done && { backgroundColor: colors.success }, current && s.stepDotCurrent]}>
                  {done && <Ionicons name="checkmark" size={16} color={colors.white} />}
                </View>
                <Text style={[s.stepLabel, current && { fontFamily: font.extrabold, color: colors.primary }]}>{t(label)}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.driver}>
          <View style={s.avatar}><Ionicons name="person-outline" size={26} color={colors.textMuted} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.driverName}>{t('trip.driver')}</Text>
            <Text style={s.small}>{t('trip.vehicle')}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('trip.call')} style={s.call}>
            <Ionicons name="call-outline" size={20} color={colors.white} />
          </Pressable>
        </View>

        <View style={s.summary}>
          <Text style={s.small}>{t('trip.destination')}</Text>
          <Text style={s.value}>{to}</Text>
          <Text style={[s.small, { marginTop: 8 }]}>{t('trip.payment')} · {cat}</Text>
          <Text style={s.value}>
            {pay === 'wallet' ? t('trip.wallet') : t('trip.momo')} · {fmt(Number(price) || 0)} FCFA
          </Text>
        </View>

        <Pressable accessibilityRole="button" onPress={cancel} style={s.cancel}>
          <Text style={s.cancelText}>{t('trip.cancel')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.border },
  map: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapText: { color: colors.textMuted, fontSize: 14, fontFamily: font.semibold },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 20, fontFamily: font.extrabold, color: colors.primary },
  eta: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: colors.accent },
  etaText: { color: colors.white, fontSize: 13, fontFamily: font.extrabold },
  steps: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotCurrent: { backgroundColor: colors.accent, borderWidth: 4, borderColor: colors.primary },
  stepLabel: { fontSize: 12, textAlign: 'center', color: colors.textMuted },
  driver: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.background },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  driverName: { fontSize: 15, fontFamily: font.extrabold, color: colors.primary },
  small: { fontSize: 12, color: colors.textMuted },
  call: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  summary: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 },
  value: { fontSize: 14, fontFamily: font.bold, color: colors.primary },
  cancel: { height: 52, borderRadius: 16, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontFamily: font.bold, color: colors.primary },
});
