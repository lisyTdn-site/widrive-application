import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Gallery } from '@/components/Gallery';
import { MapCard } from '@/components/MapCard';
import { BookingCalendar, slotIssue } from '@/components/BookingCalendar';
import { PaySheet, type PayInfo } from '@/components/PaySheet';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n, type Key } from '@/i18n';
import { rentals, DRIVER_PER_DAY } from '@/data/catalog';
import { money } from '@/lib/wallet';
import {
  activeBookings,
  confirmBooking,
  createBooking,
  useBookings,
  type Booking,
} from '@/lib/bookings';
import { dateTimeLabel, daysBetween, durationLabel } from '@/lib/dates';

const DEPOSIT_RATE = 0.3;

export default function RentalDetail() {
  const { t, lang } = useI18n();
  const { id, pay } = useLocalSearchParams<{ id: string; pay?: string }>();
  const items = useBookings();
  const car = rentals.find((r) => r.id === id);
  const resume = pay === '1' ? items.find((b) => b.listingId === id && b.status === 'pending') : undefined;

  const [fav, setFav] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const [driver, setDriver] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [pending, setPending] = useState<Booking | null>(resume ?? null);
  const [payOpen, setPayOpen] = useState(!!resume);
  const [done, setDone] = useState(false);

  const active = useMemo(() => (car ? activeBookings(items, car.id) : []), [items, car]);
  const days = start != null && end != null ? daysBetween(start, end) : 1;
  const amount = car ? days * car.pricePerDay + (driver ? days * DRIVER_PER_DAY : 0) : 0;
  const deposit = Math.round(amount * DEPOSIT_RATE);
  const issue = car ? slotIssue(items, car.id, start, end) : null;
  const canConfirm = start != null && end != null && issue === null;

  if (!car) {
    return (
      <SafeAreaView style={s.root}>
        <Text style={s.notFound}>{t('rent.notFound')}</Text>
      </SafeAreaView>
    );
  }

  const startBooking = () => {
    setStart(null);
    setEnd(null);
    setBookOpen(true);
  };

  const confirm = () => {
    if (!canConfirm || start == null || end == null) return;
    const booking = createBooking({
      kind: 'rental',
      listingId: car.id,
      title: car.name,
      start,
      end,
      amount,
      deposit,
      method: 'wallet',
      status: 'pending',
      paid: 0,
    });
    setPending(booking);
    setBookOpen(false);
    setPayOpen(true);
  };

  const onPaid = (info: PayInfo) => {
    if (!pending) return;
    confirmBooking(pending.id, info.amount, info.method);
    setPending(null);
    setPayOpen(false);
    setDone(true);
  };

  const specs: [string, string][] = [
    [t('vehicle.type'), t(`rent.cat.${car.category}` as Key)],
    [t('vehicle.gearbox'), t(`rent.gear.${car.gearbox}` as Key)],
    [t('vehicle.fuel'), t(`rent.fuel.${car.fuel}` as Key)],
    [t('vehicle.seats'), String(car.seats)],
  ];

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.hero}>
          <Gallery
            photos={car.photos}
            height={300}
            caption={() => `${car.name} · ${t('rent.verified')}`}
          />
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/' as never))}
            style={({ pressed }) => [s.float, s.floatLeft, pressed && s.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => setFav(!fav)}
            style={({ pressed }) => [s.float, s.floatRight, pressed && s.pressed]}
            accessibilityRole="button"
          >
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={21} color={fav ? colors.accent : colors.primary} />
          </Pressable>
        </View>

        <View style={s.body}>
          <View style={s.titleRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.title}>{car.name}</Text>
              <Text style={s.loc}>
                <Ionicons name="location-outline" size={15} color={colors.textMuted} />{' '}
                {car.city[lang]} · {t('rent.verified')}
              </Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeText}>{t(`rent.cat.${car.category}` as Key)}</Text>
            </View>
          </View>

          <Text style={s.price}>
            {money(car.pricePerDay)} <Text style={s.per}>{t('rent.perDay')}</Text>
          </Text>
          <View style={s.rating}>
            <Ionicons name="star" size={16} color={colors.gold} />
            <Text style={s.ratingText}>{car.rating.toFixed(1).replace('.', ',')}</Text>
            <Text style={s.muted}> · {car.reviews} {t('rent.reviews')}</Text>
          </View>

          <Text style={s.section}>{t('rent.about')}</Text>
          <Text style={s.text}>{car.description[lang]}</Text>

          <Text style={s.section}>{t('rent.characteristics')}</Text>
          <View style={s.box}>
            {specs.map(([k, v], i) => (
              <View key={k} style={[s.row, i > 0 && s.rowLine]}>
                <Text style={s.key}>{k}</Text>
                <Text style={s.val}>{v}</Text>
              </View>
            ))}
          </View>

          <Text style={s.section}>{t('rent.equipment')}</Text>
          <View style={s.tags}>
            {car.equipment.map((x) => (
              <View key={x} style={s.tag}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                <Text style={s.tagText}>{t(x as Key)}</Text>
              </View>
            ))}
          </View>

          <Text style={s.section}>{t('rent.bookedSlots')}</Text>
          {active.length === 0 ? (
            <Text style={s.text}>{t('cal.free')}</Text>
          ) : (
            <View style={s.box}>
              {active.map((b, i) => (
                <View key={b.id} style={[s.row, i > 0 && s.rowLine]}>
                  <Ionicons name="time-outline" size={15} color={colors.danger} />
                  <Text style={s.busyText}>
                    {dateTimeLabel(b.start, lang)} → {dateTimeLabel(b.end, lang)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ marginTop: spacing.lg }}>
            <MapCard lat={car.lat} lng={car.lng} label={car.name} title={t('apt.location')} />
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <View>
          <Text style={s.footerPrice}>{money(car.pricePerDay)}</Text>
          <Text style={s.footerPer}>{t('rent.perDay')}</Text>
        </View>
        <Pressable
          onPress={startBooking}
          style={({ pressed }) => [s.cta, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Text style={s.ctaText}>{t('rent.reserveNow')}</Text>
        </Pressable>
      </View>

      <Modal visible={bookOpen} animationType="slide" onRequestClose={() => setBookOpen(false)}>
        <SafeAreaView style={s.modalRoot} edges={['top']}>
          <View style={s.modalHead}>
            <Pressable
              onPress={() => setBookOpen(false)}
              style={({ pressed }) => [s.round, pressed && s.pressed]}
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={22} color={colors.primary} />
            </Pressable>
            <Text style={s.modalTitle}>{t('rent.bookTitle')}</Text>
            <View style={s.roundGhost} />
          </View>

          <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={s.pickHint}>{t('rent.pickSlot')}</Text>

            <BookingCalendar
              listingId={car.id}
              items={items}
              start={start}
              end={end}
              onChange={(a, b) => { setStart(a); setEnd(b); }}
            />

            <Pressable
              onPress={() => setDriver(!driver)}
              style={[s.driverRow, driver && s.driverOn]}
              accessibilityRole="switch"
              accessibilityState={{ checked: driver }}
            >
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={s.optTitle}>{driver ? t('rent.withDriverShort') : t('rent.noDriver')}</Text>
                <Text style={s.optSub}>+{money(DRIVER_PER_DAY)} {t('rent.perDay')}</Text>
              </View>
              <Ionicons
                name={driver ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={driver ? colors.accent : colors.border}
              />
            </Pressable>

            <Text style={s.section}>{t('rent.summary')}</Text>
            <View style={s.box}>
              <Line label={t('rent.vehicle')} value={car.name} />
              <Line
                label={t('rent.period')}
                value={
                  start != null && end != null
                    ? `${dateTimeLabel(start, lang)} → ${dateTimeLabel(end, lang)}`
                    : '—'
                }
                line
              />
              <Line
                label={t('rent.durationLabel')}
                value={start != null && end != null ? durationLabel(start, end, lang) : '—'}
                line
              />
              <Line label={t('rent.driverLabel')} value={driver ? t('rent.withDriverShort') : t('rent.noDriver')} line />
              <Line label={t('rent.total')} value={money(amount)} line strong />
            </View>
          </ScrollView>

          <View style={s.modalFooter}>
            <Pressable
              disabled={!canConfirm}
              onPress={confirm}
              style={({ pressed }) => [s.cta, !canConfirm && s.ctaOff, pressed && canConfirm && s.pressed]}
            >
              <Text style={s.ctaText}>{t('rent.confirm')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      <PaySheet
        visible={payOpen}
        title={car.name}
        amount={pending ? pending.amount : amount}
        deposit={pending ? pending.deposit : deposit}
        onClose={() => setPayOpen(false)}
        onPaid={onPaid}
      />

      <Modal visible={done} transparent animationType="fade" onRequestClose={() => setDone(false)}>
        <View style={s.overlay}>
          <View style={s.success}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
            <Text style={s.successTitle}>{t('rent.booked')}</Text>
            <Text style={s.successText}>{t('rent.bookedMsg')}</Text>
            <Pressable
              onPress={() => { setDone(false); router.push('/bookings' as never); }}
              style={s.cta}
            >
              <Text style={s.ctaText}>{t('bk.seeAll')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Line({ label, value, line, strong }: { label: string; value: string; line?: boolean; strong?: boolean }) {
  return (
    <View style={[s.row, line && s.rowLine]}>
      <Text style={s.key}>{label}</Text>
      <Text style={[s.val, strong && s.valStrong]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  notFound: { padding: spacing.xxl, fontSize: 16, color: colors.primary },
  content: { paddingBottom: 120 },
  hero: { position: 'relative' },
  float: {
    position: 'absolute',
    top: spacing.md,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatLeft: { left: spacing.lg },
  floatRight: { right: spacing.lg },
  body: { padding: spacing.lg, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xs },
  title: { fontSize: 24, lineHeight: 29, fontFamily: font.extrabold, color: colors.primary },
  loc: { fontSize: 14, color: colors.textMuted },
  badge: { backgroundColor: colors.accentTint, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.sm },
  badgeText: { color: colors.accent, fontSize: 12, fontFamily: font.extrabold },
  price: { fontSize: 22, fontFamily: font.extrabold, color: colors.accent, marginTop: spacing.xs },
  per: { fontSize: 13, color: colors.textMuted, fontFamily: font.semibold },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { fontFamily: font.extrabold, color: colors.primary, marginLeft: 4 },
  muted: { color: colors.textMuted },
  section: { fontSize: 17, fontFamily: font.extrabold, color: colors.primary, marginTop: spacing.lg, marginBottom: spacing.xs },
  text: { fontSize: 14, lineHeight: 21, color: colors.primary },
  box: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.md },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.border },
  key: { fontSize: 14, color: colors.textMuted, fontFamily: font.semibold, flexShrink: 1 },
  val: { fontSize: 14, fontFamily: font.extrabold, color: colors.primary, textAlign: 'right', flexShrink: 1 },
  valStrong: { color: colors.accent, fontSize: 16 },
  busyText: { flex: 1, fontSize: 13, fontFamily: font.semibold, color: colors.primary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  tagText: { fontSize: 13, fontFamily: font.bold, color: colors.primary },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerPrice: { fontSize: 20, fontFamily: font.extrabold, color: colors.primary },
  footerPer: { fontSize: 12, color: colors.textMuted, fontFamily: font.semibold },
  cta: {
    flex: 1,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  ctaOff: { opacity: 0.45 },
  ctaText: { color: colors.white, fontSize: 15, fontFamily: font.extrabold, letterSpacing: 0.4 },
  modalRoot: { flex: 1, backgroundColor: colors.background },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontFamily: font.extrabold, color: colors.primary },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundGhost: { width: 42 },
  modalBody: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  pickHint: { fontSize: 13, color: colors.textMuted, fontFamily: font.semibold },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  driverOn: { borderColor: colors.accent },
  optTitle: { fontSize: 15, fontFamily: font.extrabold, color: colors.primary },
  optSub: { fontSize: 12, color: colors.textMuted },
  modalFooter: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  success: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  successTitle: { fontSize: 22, fontFamily: font.extrabold, color: colors.primary },
  successText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  pressed: { opacity: 0.75 },
});
