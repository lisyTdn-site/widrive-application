import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Gallery } from '@/components/Gallery';
import { MapCard } from '@/components/MapCard';
import { Img } from '@/components/Img';
import { Spec } from '@/components/Spec';
import { BookingCalendar, slotIssue } from '@/components/BookingCalendar';
import { PaySheet, type PayInfo } from '@/components/PaySheet';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n, type Key } from '@/i18n';
import { apartments, type AptRoom } from '@/data/catalog';
import { money } from '@/lib/wallet';
import {
  activeBookings,
  confirmBooking,
  createBooking,
  useBookings,
  type Booking,
} from '@/lib/bookings';
import { dateTimeLabel, durationLabel } from '@/lib/dates';

const DEPOSIT_RATE = 0.3;

export default function HousingDetail() {
  const { t, lang } = useI18n();
  const { id, pay } = useLocalSearchParams<{ id: string; pay?: string }>();
  const items = useBookings();
  const apt = apartments.find((a) => a.id === id);
  const resume = pay === '1' ? items.find((b) => b.listingId === id && b.status === 'pending') : undefined;

  const [fav, setFav] = useState(false);
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const [calOpen, setCalOpen] = useState(false);
  const [pending, setPending] = useState<Booking | null>(resume ?? null);
  const [payOpen, setPayOpen] = useState(!!resume);
  const [done, setDone] = useState(false);

  const active = useMemo(() => (apt ? activeBookings(items, apt.id) : []), [items, apt]);
  const amount = apt ? apt.pricePerMonth : 0;
  const deposit = Math.round(amount * DEPOSIT_RATE);
  const issue = apt ? slotIssue(items, apt.id, start, end) : null;
  const canReserve = start != null && end != null && issue === null;

  if (!apt) {
    return (
      <SafeAreaView style={s.root}>
        <Text style={s.notFound}>{t('apt.notFound')}</Text>
      </SafeAreaView>
    );
  }

  const photos = apt.photos.map((p) => p.source);
  const roomLabel = (room: AptRoom) => t(`apt.room.${room}` as Key);

  const reserve = () => {
    if (!canReserve || start == null || end == null) return;
    const booking = createBooking({
      kind: 'housing',
      listingId: apt.id,
      title: apt.title[lang],
      start,
      end,
      amount,
      deposit,
      method: 'wallet',
      status: 'pending',
      paid: 0,
    });
    setPending(booking);
    setCalOpen(false);
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
    [t('apt.kind'), t(`apt.type.${apt.type}` as Key)],
    [t('apt.quartier'), apt.quartier[lang]],
    [t('apt.city'), apt.city[lang]],
    [t('apt.surface'), `${apt.size} m²`],
  ];

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={s.hero}>
          <Gallery
            photos={photos}
            height={300}
            caption={(i) => roomLabel(apt.photos[i].room)}
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
          <Text style={s.title}>{apt.title[lang]}</Text>
          <Text style={s.loc}>
            <Ionicons name="location-outline" size={15} color={colors.textMuted} /> {apt.area[lang]} ·{' '}
            {t('apt.verified')}
          </Text>

          <Text style={s.price}>
            {money(apt.pricePerMonth)} <Text style={s.per}>{t('apt.perMonthShort')}</Text>
          </Text>
          <View style={s.rating}>
            <Ionicons name="star" size={16} color={colors.gold} />
            <Text style={s.ratingText}>{apt.rating.toFixed(1).replace('.', ',')}</Text>
            <Text style={s.muted}> · {apt.reviews} {t('apt.reviews')}</Text>
          </View>

          <View style={s.chips}>
            <Spec icon="bed-outline" text={t('apt.beds', { n: apt.beds })} />
            <Spec icon="water-outline" text={t('apt.baths', { n: apt.baths })} />
            <Spec icon="resize-outline" text={`${apt.size} m²`} />
          </View>

          <Text style={s.section}>{t('apt.description')}</Text>
          <Text style={s.text}>{apt.description[lang]}</Text>

          <Text style={s.section}>{t('apt.characteristics')}</Text>
          <View style={s.box}>
            {specs.map(([k, v], i) => (
              <View key={k} style={[s.row, i > 0 && s.rowLine]}>
                <Text style={s.key}>{k}</Text>
                <Text style={s.val}>{v}</Text>
              </View>
            ))}
          </View>

          <Text style={s.section}>{t('apt.equipment')}</Text>
          <View style={s.tags}>
            {apt.features.map((f) => (
              <View key={f} style={s.tag}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
                <Text style={s.tagText}>{t(`feat.${f}` as Key)}</Text>
              </View>
            ))}
          </View>

          <Text style={s.section}>{t('apt.rooms')}</Text>
          <View style={s.rooms}>
            {apt.photos.map((p) => (
              <View key={p.room} style={s.room}>
                <Img source={p.source} style={s.roomImg} />
                <Text style={s.roomLabel}>{roomLabel(p.room)}</Text>
              </View>
            ))}
          </View>

          <Text style={s.section}>{t('apt.host')}</Text>
          <View style={s.host}>
            <View style={s.hostAvatar}>
              <Ionicons name="business-outline" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.hostName}>{t('apt.host')}</Text>
              <Text style={s.hostNote}>{t('apt.hostNote')}</Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <MapCard
              lat={apt.lat}
              lng={apt.lng}
              label={`${apt.title[lang]} · ${apt.area[lang]}`}
              title={t('apt.location')}
            />
          </View>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <View>
          <Text style={s.footerPrice}>{money(apt.pricePerMonth)}</Text>
          <Text style={s.footerPer}>{t('apt.perMonthShort')}</Text>
        </View>
        <Pressable
          onPress={() => { setStart(null); setEnd(null); setCalOpen(true); }}
          style={({ pressed }) => [s.cta, pressed && s.pressed]}
          accessibilityRole="button"
        >
          <Text style={s.ctaText}>{t('apt.availability')}</Text>
        </Pressable>
      </View>

      <Modal visible={calOpen} animationType="slide" onRequestClose={() => setCalOpen(false)}>
        <SafeAreaView style={s.modalRoot} edges={['top']}>
          <View style={s.modalHead}>
            <Pressable
              onPress={() => setCalOpen(false)}
              style={({ pressed }) => [s.round, pressed && s.pressed]}
              accessibilityLabel={t('common.close')}
            >
              <Ionicons name="close" size={22} color={colors.primary} />
            </Pressable>
            <Text style={s.modalTitle}>{t('apt.availability')}</Text>
            <View style={s.roundGhost} />
          </View>

          <ScrollView contentContainerStyle={s.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={s.pickHint}>{t('apt.chooseSlot')}</Text>

            <BookingCalendar
              listingId={apt.id}
              items={items}
              start={start}
              end={end}
              onChange={(a, b) => { setStart(a); setEnd(b); }}
            />

            {issue === 'busy' ? (
              <View style={s.busyBanner}>
                <Ionicons name="close-circle" size={18} color={colors.danger} />
                <Text style={s.busyText}>{t('apt.unavailable')}</Text>
              </View>
            ) : start != null && end != null ? (
              <View style={s.freeBanner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={s.freeText}>{t('apt.available')}</Text>
              </View>
            ) : null}

            {active.length > 0 ? (
              <>
                <Text style={s.section}>{t('rent.bookedSlots')}</Text>
                <View style={s.box}>
                  {active.map((b, i) => (
                    <View key={b.id} style={[s.row, i > 0 && s.rowLine]}>
                      <Ionicons name="time-outline" size={15} color={colors.danger} />
                      <Text style={s.busySlot}>
                        {dateTimeLabel(b.start, lang)} → {dateTimeLabel(b.end, lang)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {start != null && end != null ? (
              <>
                <Text style={s.section}>{t('rent.summary')}</Text>
                <View style={s.box}>
                  <View style={s.row}>
                    <Text style={s.key}>{t('rent.period')}</Text>
                    <Text style={s.val} numberOfLines={2}>
                      {dateTimeLabel(start, lang)} → {dateTimeLabel(end, lang)}
                    </Text>
                  </View>
                  <View style={[s.row, s.rowLine]}>
                    <Text style={s.key}>{t('rent.durationLabel')}</Text>
                    <Text style={s.val}>{durationLabel(start, end, lang)}</Text>
                  </View>
                  <View style={[s.row, s.rowLine]}>
                    <Text style={s.key}>{t('rent.total')}</Text>
                    <Text style={[s.val, s.valStrong]}>{money(amount)}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </ScrollView>

          <View style={s.modalFooter}>
            <Pressable
              disabled={!canReserve}
              onPress={reserve}
              style={({ pressed }) => [
                s.cta,
                !canReserve && (issue === 'busy' ? s.ctaBusy : s.ctaOff),
                pressed && canReserve && s.pressed,
              ]}
            >
              <Text style={s.ctaText}>{issue === 'busy' ? t('apt.unavailable') : t('apt.reserve')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>

      <PaySheet
        visible={payOpen}
        title={apt.title[lang]}
        amount={pending ? pending.amount : amount}
        deposit={pending ? pending.deposit : deposit}
        onClose={() => setPayOpen(false)}
        onPaid={onPaid}
      />

      <Modal visible={done} transparent animationType="fade" onRequestClose={() => setDone(false)}>
        <View style={s.overlay}>
          <View style={s.success}>
            <Ionicons name="checkmark-circle" size={72} color={colors.success} />
            <Text style={s.successTitle}>{t('apt.booked')}</Text>
            <Text style={s.successText}>{t('apt.bookedMsg')}</Text>
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
  title: { fontSize: 24, lineHeight: 29, fontFamily: font.extrabold, color: colors.primary, marginTop: spacing.xs },
  loc: { fontSize: 14, color: colors.textMuted },
  price: { fontSize: 22, fontFamily: font.extrabold, color: colors.accent, marginTop: spacing.xs },
  per: { fontSize: 13, color: colors.textMuted, fontFamily: font.semibold },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ratingText: { fontFamily: font.extrabold, color: colors.primary, marginLeft: 4 },
  muted: { color: colors.textMuted },
  chips: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
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
  rooms: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  room: { width: '48.5%', gap: 6 },
  roomImg: { width: '100%', height: 120, borderRadius: radius.md },
  roomLabel: { fontSize: 13, fontFamily: font.bold, color: colors.primary },
  host: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  hostAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostName: { fontSize: 15, fontFamily: font.extrabold, color: colors.primary },
  hostNote: { fontSize: 13, color: colors.textMuted },
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
    paddingHorizontal: spacing.lg,
  },
  ctaOff: { opacity: 0.45 },
  ctaBusy: { backgroundColor: colors.textMuted },
  ctaText: { color: colors.white, fontSize: 15, fontFamily: font.extrabold, letterSpacing: 0.3, textAlign: 'center' },
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
  busyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerTint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  busyText: { fontSize: 14, fontFamily: font.extrabold, color: colors.danger },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successTint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  freeText: { fontSize: 14, fontFamily: font.extrabold, color: colors.success },
  busySlot: { flex: 1, fontSize: 13, fontFamily: font.semibold, color: colors.primary },
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
