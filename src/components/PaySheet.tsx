import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { BALANCE, money } from '@/lib/wallet';
import { useI18n } from '@/i18n';

type Props = {
  visible: boolean;
  title: string;
  amount: number;
  onClose: () => void;
  onPaid?: () => void;
};

export function PaySheet({ visible, title, amount, onClose, onPaid }: Props) {
  const { t } = useI18n();
  const [method, setMethod] = useState<'wallet' | 'momo'>('wallet');
  const [status, setStatus] = useState<'idle' | 'busy' | 'done'>('idle');
  const enough = BALANCE >= amount;
  const blocked = method === 'wallet' && !enough;

  const close = () => {
    setStatus('idle');
    onClose();
  };
  const pay = () => {
    setStatus('busy');
    setTimeout(() => {
      setStatus('done');
      onPaid?.();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {status === 'done' ? (
            <View style={s.done}>
              <Ionicons name="checkmark-circle" size={72} color={colors.success} />
              <Text style={s.doneTitle}>{t('pay.done')}</Text>
              <Text style={s.sub}>{title}</Text>
              <Pressable onPress={close} style={s.cta}>
                <Text style={s.ctaText}>{t('pay.finish')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={s.top}>
                <Text style={s.h}>{t('pay.title')}</Text>
                <Pressable onPress={close} hitSlop={10}>
                  <Ionicons name="close" size={24} color={colors.primary} />
                </Pressable>
              </View>
              <Text style={s.sub}>{title}</Text>
              <Text style={s.amount}>{money(amount)}</Text>

              <Pressable onPress={() => setMethod('wallet')} style={[s.opt, method === 'wallet' && s.optOn]}>
                <Ionicons name="wallet-outline" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.optTitle}>{t('pay.wallet')}</Text>
                  <Text style={s.optSub}>{t('pay.available', { amount: money(BALANCE) })}</Text>
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
                <Pressable onPress={() => { close(); router.push('/transfer' as never); }}>
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
                <Text style={s.ctaText}>{status === 'busy' ? t('pay.busy') : t('pay.cta', { amount: money(amount) })}</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34, gap: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h: { fontSize: 20, fontWeight: '800', color: colors.primary },
  sub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  amount: { fontSize: 30, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: colors.border },
  optOn: { borderColor: colors.primary },
  optTitle: { fontSize: 15, fontWeight: '800', color: colors.primary },
  optSub: { fontSize: 12, color: colors.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border },
  radioOn: { borderColor: colors.accent, backgroundColor: colors.accent },
  warn: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  hint: { color: colors.textMuted, fontSize: 13 },
  cta: { height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 8, alignSelf: 'stretch' },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  done: { alignItems: 'center', gap: 8, paddingVertical: 10 },
  doneTitle: { fontSize: 22, fontWeight: '800', color: colors.primary },
});