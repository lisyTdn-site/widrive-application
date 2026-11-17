import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n } from '@/i18n';
import { deposit, money, useWallet, withdraw, type TxMethod } from '@/lib/wallet';

type Mode = 'dep' | 'ret';

const QUICK = [5000, 10000, 25000, 50000, 100000, 200000];
const MIN = 1000;

const digits = (value: string) => value.replace(/\D/g, '').slice(0, 9);

export default function Transfer() {
  const { t } = useI18n();
  const { mode: raw } = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode = raw === 'ret' ? 'ret' : 'dep';
  const isDeposit = mode === 'dep';

  const { balance } = useWallet();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<TxMethod>(isDeposit ? 'momo' : 'momo');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const value = Number(amount || '0');
  const tooSmall = value > 0 && value < MIN;
  const tooBig = !isDeposit && value > balance;
  const valid = value >= MIN && !tooBig;

  const submit = () => {
    if (!valid) {
      setError(tooSmall ? t('tf.min', { amount: money(MIN) }) : t('tf.max', { amount: money(balance) }));
      return;
    }
    setError(null);
    setStatus('busy');
    setTimeout(() => {
      if (isDeposit) deposit(value, method);
      else if (!withdraw(value, method)) {
        setStatus('idle');
        setError(t('tf.max', { amount: money(balance) }));
        return;
      }
      setStatus('done');
    }, 1100);
  };

  if (status === 'done') {
    return (
      <Screen title={t('tf.title')}>
        <View style={s.done}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          <Text style={s.doneTitle}>{isDeposit ? t('tf.depositDone') : t('tf.withdrawDone')}</Text>
          <Text style={s.doneMsg}>{isDeposit ? t('tf.depositDoneMsg') : t('tf.withdrawDoneMsg')}</Text>
          <Text style={s.doneBalance}>{t('tf.newBalance', { amount: money(balance) })}</Text>
          <Pressable onPress={() => router.back()} style={s.cta}>
            <Text style={s.ctaText}>{t('tf.finish')}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={isDeposit ? t('tf.depositTitle') : t('tf.withdrawTitle')}>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>{t('tf.available', { amount: money(balance) })}</Text>
          <Text style={s.balanceValue}>{money(balance)}</Text>
        </View>

        <Text style={s.label}>{t('tf.amount')}</Text>
        <View style={s.inputWrap}>
          <TextInput
            value={amount}
            onChangeText={(v) => { setAmount(digits(v)); setError(null); }}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={s.input}
            accessibilityLabel={t('tf.amount')}
          />
          <Text style={s.suffix}>FCFA</Text>
        </View>

        <Text style={s.label}>{t('tf.quick')}</Text>
        <View style={s.quick}>
          {QUICK.map((q) => (
            <Pressable
              key={q}
              onPress={() => { setAmount(String(q)); setError(null); }}
              style={({ pressed }) => [s.chip, amount === String(q) && s.chipOn, pressed && s.pressed]}
            >
              <Text style={[s.chipText, amount === String(q) && s.chipTextOn]}>{money(q)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>{t('tf.method')}</Text>
        <Pressable onPress={() => setMethod('momo')} style={[s.opt, method === 'momo' && s.optOn]}>
          <Ionicons name="phone-portrait-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.optTitle}>{t('wt.method.momo')}</Text>
            <Text style={s.optSub}>MTN · Moov · Celtiis</Text>
          </View>
          <View style={[s.radio, method === 'momo' && s.radioOn]} />
        </Pressable>
        <Pressable onPress={() => setMethod('cash')} style={[s.opt, method === 'cash' && s.optOn]}>
          <Ionicons name="cash-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.optTitle}>{t('wt.method.cash')}</Text>
          </View>
          <View style={[s.radio, method === 'cash' && s.radioOn]} />
        </Pressable>

        <Text style={s.hint}>{t('tf.momoHint')}</Text>
        {error ? <Text style={s.error}>{error}</Text> : null}
      </ScrollView>

      <View style={s.footer}>
        <Pressable
          disabled={!valid || status === 'busy'}
          onPress={submit}
          style={({ pressed }) => [s.cta, (!valid || status === 'busy') && s.ctaOff, pressed && s.pressed]}
        >
          <Text style={s.ctaText}>
            {status === 'busy'
              ? '…'
              : isDeposit
                ? t('tf.depositCta', { amount: money(value) })
                : t('tf.withdrawCta', { amount: money(value) })}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 120 },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 4,
    marginBottom: spacing.sm,
  },
  balanceLabel: { color: colors.onDarkMuted, fontSize: 13, fontFamily: font.semibold },
  balanceValue: { color: colors.white, fontSize: 26, fontFamily: font.extrabold },
  label: { fontSize: 13, fontFamily: font.bold, color: colors.textMuted, marginTop: spacing.sm },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  input: { flex: 1, height: 58, fontSize: 24, fontFamily: font.extrabold, color: colors.primary },
  suffix: { fontSize: 15, fontFamily: font.bold, color: colors.textMuted },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 13, fontFamily: font.bold, color: colors.primary },
  chipTextOn: { color: colors.white },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optOn: { borderColor: colors.accent },
  optTitle: { fontSize: 15, fontFamily: font.extrabold, color: colors.primary },
  optSub: { fontSize: 12, color: colors.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  error: { fontSize: 13, fontFamily: font.bold, color: colors.danger, marginTop: spacing.xs },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOff: { opacity: 0.45 },
  ctaText: { color: colors.white, fontSize: 15, fontFamily: font.extrabold, letterSpacing: 0.5 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  doneTitle: { fontSize: 22, fontFamily: font.extrabold, color: colors.primary },
  doneMsg: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  doneBalance: { fontSize: 16, fontFamily: font.extrabold, color: colors.accent },
  pressed: { opacity: 0.75 },
});
