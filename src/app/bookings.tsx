import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n, type Key } from '@/i18n';
import { cancelBooking, useMyBookings, type Booking, type BookingStatus } from '@/lib/bookings';
import { money, refreshWallet } from '@/lib/wallet';
import { dateTimeLabel } from '@/lib/dates';

const statusColor = (status: BookingStatus) =>
  status === 'confirmed' ? colors.success : status === 'pending' ? colors.warning : colors.textMuted;

const statusTint = (status: BookingStatus) =>
  status === 'confirmed' ? colors.successTint : status === 'pending' ? colors.warningTint : colors.surfaceAlt;

export default function Bookings() {
  const { t, lang } = useI18n();
  const items = useMyBookings();
  const [ask, setAsk] = useState<Booking | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);

  const openListing = (b: Booking) =>
    router.push(
      (b.kind === 'rental' ? `/rental/${b.listingId}?pay=1` : `/housing/${b.listingId}?pay=1`) as never
    );

  const confirmCancel = async () => {
    if (!ask) return;
    const target = ask;
    setAsk(null);
    if (await cancelBooking(target.id)) {
      await refreshWallet();
      setDone(target.id);
    }
  };

  return (
    <Screen title={t('bk.title')}>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {sorted.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={44} color={colors.textMuted} />
            <Text style={s.emptyText}>{t('bk.empty')}</Text>
          </View>
        ) : (
          sorted.map((b) => (
            <View key={b.id} style={s.card}>
              <View style={s.top}>
                <View style={s.kindWrap}>
                  <Ionicons
                    name={b.kind === 'rental' ? 'car-outline' : 'home-outline'}
                    size={16}
                    color={colors.accent}
                  />
                  <Text style={s.kind}>{t(`bk.kind.${b.kind}` as Key)}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: statusTint(b.status) }]}>
                  <Text style={[s.badgeText, { color: statusColor(b.status) }]}>
                    {t(`bk.status.${b.status}` as Key)}
                  </Text>
                </View>
              </View>

              <Text style={s.title}>{b.title}</Text>
              <Text style={s.ref}>{t('bk.ref', { ref: b.ref })}</Text>

              <View style={s.period}>
                <Ionicons name="time-outline" size={15} color={colors.textMuted} />
                <Text style={s.periodText}>
                  {dateTimeLabel(b.start, lang)} → {dateTimeLabel(b.end, lang)}
                </Text>
              </View>

              <View style={s.money}>
                <View style={s.moneyItem}>
                  <Text style={s.moneyLabel}>{t('bk.total')}</Text>
                  <Text style={s.moneyValue}>{money(b.amount)}</Text>
                </View>
                <View style={s.moneyItem}>
                  <Text style={s.moneyLabel}>{t('bk.paid')}</Text>
                  <Text style={[s.moneyValue, { color: colors.success }]}>{money(b.paid)}</Text>
                </View>
                <View style={s.moneyItem}>
                  <Text style={s.moneyLabel}>{t('bk.due')}</Text>
                  <Text style={[s.moneyValue, { color: colors.accent }]}>
                    {money(Math.max(0, b.amount - b.paid))}
                  </Text>
                </View>
              </View>

              {done === b.id ? (
                <View style={s.note}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={s.noteText}>
                    {t('bk.cancelledMsg')}
                    {b.paid > 0 ? ` ${t('bk.refunded', { amount: money(b.paid) })}` : ''}
                  </Text>
                </View>
              ) : null}

              {b.status !== 'cancelled' ? (
                <View style={s.actions}>
                  {b.status === 'pending' ? (
                    <Pressable
                      onPress={() => openListing(b)}
                      style={({ pressed }) => [s.btn, s.btnPrimary, pressed && s.pressed]}
                    >
                      <Text style={s.btnTextOn}>{t('bk.pay')}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => setAsk(b)}
                    style={({ pressed }) => [s.btn, s.btnOutline, pressed && s.pressed]}
                  >
                    <Text style={s.btnText}>{t('bk.cancel')}</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!ask} transparent animationType="fade" onRequestClose={() => setAsk(null)}>
        <Pressable style={s.overlay} onPress={() => setAsk(null)}>
          <Pressable style={s.dialog} onPress={() => undefined}>
            <Text style={s.dialogTitle}>{t('bk.cancelAsk')}</Text>
            <Text style={s.dialogText}>{t('bk.cancelText')}</Text>
            <View style={s.dialogActions}>
              <Pressable onPress={() => setAsk(null)} style={[s.btn, s.btnOutline]}>
                <Text style={s.btnText}>{t('bk.no')}</Text>
              </Pressable>
              <Pressable onPress={confirmCancel} style={[s.btn, s.btnDanger]}>
                <Text style={s.btnTextOn}>{t('bk.yes')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: 80 },
  emptyText: { color: colors.textMuted, fontSize: 15, fontFamily: font.semibold },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kindWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kind: { fontSize: 12, fontFamily: font.extrabold, color: colors.accent, letterSpacing: 0.4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  badgeText: { fontSize: 11, fontFamily: font.extrabold },
  title: { fontSize: 18, fontFamily: font.extrabold, color: colors.primary },
  ref: { fontSize: 12, color: colors.textMuted, fontFamily: font.semibold },
  period: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  periodText: { fontSize: 13, color: colors.primary, fontFamily: font.semibold, flex: 1 },
  money: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  moneyItem: { flex: 1, gap: 2 },
  moneyLabel: { fontSize: 11, fontFamily: font.semibold, color: colors.textMuted },
  moneyValue: { fontSize: 14, fontFamily: font.extrabold, color: colors.primary },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  noteText: { flex: 1, fontSize: 12, fontFamily: font.semibold, color: colors.success },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  btn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.accent },
  btnDanger: { backgroundColor: colors.danger },
  btnOutline: { borderWidth: 2, borderColor: colors.border },
  btnText: { fontSize: 14, fontFamily: font.extrabold, color: colors.primary },
  btnTextOn: { fontSize: 14, fontFamily: font.extrabold, color: colors.white },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm, width: '100%' },
  dialogTitle: { fontSize: 18, fontFamily: font.extrabold, color: colors.primary },
  dialogText: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  dialogActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  pressed: { opacity: 0.75 },
});
