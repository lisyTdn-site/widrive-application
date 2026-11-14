import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Chips } from '@/components/Chips';
import { Img } from '@/components/Img';
import { Spec } from '@/components/Spec';
import { PaySheet } from '@/components/PaySheet';
import { rentals, DRIVER_PER_DAY } from '@/data/catalog';
import { money } from '@/lib/wallet';
import { useI18n, type Key } from '@/i18n';
import { colors } from '@/theme/colors';

const CATS = ['all', 'city', 'sedan', 'suv', 'pickup', 'minibus'] as const;
type Cat = (typeof CATS)[number];

export default function Location() {
  const { t } = useI18n();
  const [cat, setCat] = useState<Cat>('all');
  const [sel, setSel] = useState<string | null>(null);
  const [days, setDays] = useState(1);
  const [driver, setDriver] = useState(false);
  const [pay, setPay] = useState(false);
  const list = rentals.filter((r) => cat === 'all' || r.category === cat);
  const car = rentals.find((r) => r.id === sel);
  const total = car ? (car.pricePerDay + (driver ? DRIVER_PER_DAY : 0)) * days : 0;
  const dayLabel = days === 1 ? t('rent.day', { n: days }) : t('rent.days', { n: days });
  const catLabel = (c: Cat) => (c === 'all' ? t('common.all') : t(`rent.cat.${c}` as Key));

  return (
    <Screen title={t('rent.title')}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: car ? 250 : 34 }}>
        <View style={s.hero}><Text style={s.eyebrow}>WIDRIVE RENT</Text><Text style={s.heading}>Louez la voiture idéale</Text><Text style={s.subheading}>Un véhicule fiable, avec ou sans chauffeur.</Text></View>
        <Chips items={CATS} value={cat} onChange={setCat} label={catLabel} />
        <View style={s.list}>{list.map((r) => <Pressable key={r.id} onPress={() => setSel(r.id)} style={[s.card, sel === r.id && s.cardOn]}><View><Img source={r.image} style={s.img} /><Pressable style={s.heart} onPress={() => undefined}><Ionicons name="heart-outline" size={20} color={colors.primary} /></Pressable><View style={s.counter}><Text style={s.counterText}>1 / 4</Text></View></View><View style={s.body}><View style={s.row}><Text style={s.name}>{r.name}</Text><View style={s.badge}><Text style={s.badgeText}>{catLabel(r.category)}</Text></View></View><View style={s.specs}><Spec icon="people-outline" text={t('rent.seats', { n: r.seats })} /><Spec icon="settings-outline" text={t(`rent.gear.${r.gearbox}` as Key)} /><Spec icon="flame-outline" text={t(`rent.fuel.${r.fuel}` as Key)} /></View><Text style={s.price}>{money(r.pricePerDay)} <Text style={s.per}>{t('rent.perDay')}</Text></Text></View></Pressable>)}</View>
      </ScrollView>
      {car && <View style={s.bar}><View style={s.barTitle}><View><Text style={s.selected}>{car.name}</Text><Text style={s.muted}>{money(car.pricePerDay)} {t('rent.perDay')}</Text></View><Pressable onPress={() => setSel(null)}><Ionicons name="close-circle" size={23} color={colors.textMuted} /></Pressable></View><View style={s.barRow}><Text style={s.barLabel}>{t('rent.duration')}</Text><View style={s.stepper}><Pressable onPress={() => setDays(Math.max(1, days - 1))} style={s.stepBtn}><Ionicons name="remove" size={20} color={colors.primary} /></Pressable><Text style={s.stepText}>{dayLabel}</Text><Pressable onPress={() => setDays(days + 1)} style={s.stepBtn}><Ionicons name="add" size={20} color={colors.primary} /></Pressable></View></View><View style={s.barRow}><Text style={s.barLabel}>{t('rent.withDriver', { price: money(DRIVER_PER_DAY) })}</Text><Switch value={driver} onValueChange={setDriver} trackColor={{ true: colors.accent }} /></View><Pressable onPress={() => setPay(true)} style={s.cta}><Text style={s.ctaText}>{t('rent.book', { amount: money(total) })}</Text></Pressable></View>}
      <PaySheet visible={pay} title={car ? `${car.name} · ${dayLabel}${driver ? ' · ' + t('rent.driverShort') : ''}` : ''} amount={total} onClose={() => setPay(false)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { padding: 18, paddingBottom: 10, gap: 4 }, eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, heading: { fontSize: 24, lineHeight: 29, fontWeight: '900', color: colors.primary }, subheading: { color: colors.textMuted, fontSize: 14 }, list: { padding: 16, gap: 14 }, card: { backgroundColor: colors.surface, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' }, cardOn: { borderColor: colors.accent }, img: { width: '100%', height: 176 }, heart: { position: 'absolute', top: 10, right: 10, width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFFE8', alignItems: 'center', justifyContent: 'center' }, counter: { position: 'absolute', right: 12, bottom: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: '#00000080' }, counterText: { color: '#fff', fontSize: 11, fontWeight: '700' }, body: { padding: 14, gap: 8 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, name: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.primary }, badge: { backgroundColor: colors.accentTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }, badgeText: { color: colors.accent, fontSize: 12, fontWeight: '800' }, specs: { flexDirection: 'row', gap: 14 }, price: { fontSize: 18, fontWeight: '900', color: colors.primary }, per: { fontSize: 13, color: colors.textMuted, fontWeight: '600' }, bar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, padding: 16, paddingBottom: 28, gap: 12, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 12 }, barTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, selected: { fontSize: 17, fontWeight: '900', color: colors.primary }, muted: { color: colors.textMuted, fontSize: 13, marginTop: 2 }, barRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, barLabel: { fontSize: 14, fontWeight: '700', color: colors.primary, flexShrink: 1 }, stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 }, stepBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, stepText: { fontSize: 15, fontWeight: '800', minWidth: 72, textAlign: 'center' }, cta: { height: 54, borderRadius: 27, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, ctaText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
