import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, font, radius, spacing } from '@/theme';
import { chargeWallet, money, useWallet } from '@/lib/wallet';
import { useI18n } from '@/i18n';

export type PayMode = 'deposit' | 'full';
export type PayInfo = { amount: number; method: 'wallet' | 'momo'; mode: PayMode };

type Props = {
  visible: boolean;
  title: string;
  amount: number;
  /** Si fourni, l'utilisateur peut choisir de payer un acompte. */
  deposit?: number;
  onClose: () => void;
  onPaid?: (info: PayInfo) => void;
};

export function PaySheet({ visible, title, amount, deposit, onClose, onPaid }: Props) {
  const { t } = useI18n();
  const { balance } = useWallet();
  const hasDeposit = deposit != null && deposit > 0 && deposit < amount;

  const [mode, setMode] = useState<PayMode>(hasDeposit ? 'deposit' : 'full');
  const [method, setMethod] = useState<'wallet' | 'momo'>('wallet');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle');

  useEffect(() => {
    if (visible) {
      setMode(hasDeposit ? 'deposit' : 'full');
      setMethod('wallet');
      setStatus('idle');
    }
  }, [visible, hasDeposit]);

  const payAmount = mode === 'deposit' && hasDeposit ? (deposit as number) : amount;
  const enough = balance >= payAmount;
  const blocked = method === 'wallet' && !enough;

  const close = () => {
    setStatus('idle');
    onClose();
  };

  const pay = () => {
    setStatus('busy');
    setTimeout(() => {
      if (method === 'wallet') chargeWallet(payAmount, title);
      setStatus('done');
      onPaid?.({ amount: payAmount, method, mode });
    }, 1200);
  };

  const remaining = amount - payAmount;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {status === 'done' ? (
            <View style={s.done}>
              <Ionicons name="checkmark-circle" size={72} color={colors.success} />
              <Text style={s.doneTitle}>
                {mode === 'deposit' && hasDeposit ? t('pay.depositDone') : t('pay.done')}
              </Text>
              <Text style={s.sub}>{title}</Text>
              {mode === 'deposit' && hasDeposit ? (
                <Text style={s.remaining}>{t('pay.remaining', { amount: money(remaining) })}</Text>
              ) : null}
              <Pressable onPress={close} style={s.cta}>
                <Text style={s.ctaText}>{t('pay.finish')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={s.top}>
                <Text style={s.h}>{t('pay.title')}</Text>
                <Pressable onPress={close} hitSlop={10} accessibilityLabel={t('common.close')}>
                  <Ionicons name="close" size={24} color={colors.primary} />
                </Pressable>
              </View>
              <Text style={s.sub}>{title}</Text>

              {hasDeposit ? (
                <>
                  <Text style={s.groupTitle}>{t('pay.choose')}</Text>
                  <Pressable
                    onPress={() => setMode('deposit')}
                    style={[s.opt, mode === 'deposit' && s.optOn]}
                  >
                    <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.optTitle}>{t('pay.deposit')}</Text>
                      <Text style={s.optSub}>{t('pay.depositSub', { amount: money(deposit as number) })}</Text>
                    </View>
                    <View style={[s.radio, mode === 'deposit' && s.radioOn]} />
                  </Pressable>
                  <Pressable
                    onPress={() => setMode('full')}
                    style={[s.opt, mode === 'full' && s.optOn]}
                  >
                    <Ionicons name="checkmark-done-outline" size={22} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.optTitle}>{t('pay.full')}</Text>
                      <Text style={s.optSub}>{t('pay.fullSub', { amount: money(amount) })}</Text>
                    </View>
                    <View style={[s.radio, mode === 'full' && s.radioOn]} />
                  </Pressable>
                  <Text style={s.note}>{t('pay.depositNote')}</Text>
                </>
              ) : null}

              <Text style={s.amount}>{money(payAmount)}</Text>

              <Pressable onPress={() => setMethod('wallet')} style={[s.opt, method === 'wallet' && s.optOn]}>
                <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.optTitle}>{t('pay.wallet')}</Text>
                  <Text style={s.optSub}>{t('pay.available', { amount: money(balance) })}</Text>
                </View>
                <View style={[s.radio, method === 'wallet' && s.radioOn]} />
              </Pressable>

              <Pressable onPress={() => setMethod('momo')} style={[s.opt, method === 'momo' && s.optOn]}>
                <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.optTitle}>{t('pay.momo')}</Text>
                  <Text style={s.optSub}>{t('pay.momoSub')}</Text>
                </View>
                <View style={[s.radio, method === 'momo' && s.radioOn]} />
              </Pressable>

              {blocked && (
                <Pressable onPress={() => { close(); router.push('/transfer?mode=dep' as never); }}>
                  <Text style={s.warn}>
                    {t('pay.insufficient')}
                    <Text style={{ textDecorationLine: 'underline' }}>{t('pay.topup')}</Text>
                  </Text>
                </Pressable>
              )}
              {method === 'momo' && <Text style={s.hint}>{t('pay.momoHint')}</Text>}

              <Pressable
                disabled={blocked || status === 'busy'}
                onPress={pay}
                style={[s.cta, (blocked || status === 'busy') && { opacity: 0.5 }]}
              >
                <Text style={s.ctaText}>
                  {status === 'busy' ? t('pay.busy') : t('pay.cta', { amount: money(payAmount) })}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34, gap: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h: { fontSize: 20, fontFamily: font.extrabold, color: colors.primary },
  sub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  groupTitle: { fontSize: 14, fontFamily: font.extrabold, color: colors.primary, marginTop: 4 },
  amount: { fontSize: 30, fontFamily: font.extrabold, color: colors.primary, marginVertical: 4, textAlign: 'center' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border },
  optOn: { borderColor: colors.primary },
  optTitle: { fontSize: 15, fontFamily: font.extrabold, color: colors.primary },
  optSub: { fontSize: 12, color: colors.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  note: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  warn: { color: colors.accent, fontFamily: font.bold, fontSize: 13 },
  hint: { color: colors.textMuted, fontSize: 13 },
  remaining: { fontSize: 14, fontFamily: font.bold, color: colors.accent },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 8, alignSelf: 'stretch' },
  ctaText: { color: colors.white, fontSize: 15, fontFamily: font.extrabold, letterSpacing: 0.5 },
  done: { alignItems: 'center', gap: 8, paddingVertical: 10 },
  doneTitle: { fontSize: 22, fontFamily: font.extrabold, color: colors.primary },
});
