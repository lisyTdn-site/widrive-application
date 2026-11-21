import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Chips } from '@/components/Chips';
import { Img } from '@/components/Img';
import { Spec } from '@/components/Spec';
import { ZoneMap } from '@/components/ZoneMap';
import { useRentals } from '@/lib/catalogListings';
import { CALAVI } from '@/data/zones';
import { money } from '@/lib/wallet';
import { useI18n, type Key } from '@/i18n';
import { colors, font } from '@/theme';

const CATS = ['all', 'city', 'sedan', 'suv', 'pickup', 'minibus'] as const;
type Cat = (typeof CATS)[number];

export default function Location() {
  const { t, lang, tr } = useI18n();
  const [cat, setCat] = useState<Cat>('all');
  const { data: rentals } = useRentals();
  const list = rentals.filter((r) => cat === 'all' || r.category === cat);
  const catLabel = (c: Cat) => (c === 'all' ? t('common.all') : t(`rent.cat.${c}` as Key));

  return (
    <Screen title={t('rent.title')}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <View style={s.hero}>
          <Text style={s.eyebrow}>WIDRIVE RENT</Text>
          <Text style={s.heading}>{t('rent.heroTitle')}</Text>
          <Text style={s.subheading}>{t('rent.heroSub')}</Text>
          <View style={s.zone}>
            <Ionicons name="location" size={13} color={colors.accent} />
            <Text style={s.zoneText}>{t('zone.here', { zone: tr(CALAVI.name) })}</Text>
          </View>
        </View>

        <Chips items={CATS} value={cat} onChange={setCat} label={catLabel} />

        <ZoneMap
          points={list.map((r) => ({ lat: r.lat, lng: r.lng, label: r.name }))}
          title={t('zone.rentTitle', { zone: tr(CALAVI.name) })}
          height={200}
        />

        <View style={s.list}>
          {list.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/rental/${r.id}` as never)}
              style={({ pressed }) => [s.card, pressed && s.pressed]}
              accessibilityRole="button"
            >
              <View>
                <Img source={r.image} style={s.img} />
                <View style={s.counter}>
                  <Text style={s.counterText}>{t('apt.photos', { n: r.photos.length })}</Text>
                </View>
                <View style={s.rating}>
                  <Ionicons name="star" size={13} color={colors.gold} />
                  <Text style={s.ratingText}>{r.rating.toFixed(1).replace('.', ',')}</Text>
                </View>
              </View>

              <View style={s.body}>
                <View style={s.row}>
                  <Text style={s.name}>{r.name}</Text>
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{catLabel(r.category)}</Text>
                  </View>
                </View>

                <View style={s.specs}>
                  <Spec icon="people-outline" text={t('rent.seats', { n: r.seats })} />
                  <Spec icon="settings-outline" text={t(`rent.gear.${r.gearbox}` as Key)} />
                  <Spec icon="flame-outline" text={t(`rent.fuel.${r.fuel}` as Key)} />
                </View>

                <View style={s.foot}>
                  <Text style={s.price}>
                    {money(r.pricePerDay)} <Text style={s.per}>{t('rent.perDay')}</Text>
                  </Text>
                  <View style={s.detail}>
                    <Text style={s.detailText}>{t('rent.details')}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                  </View>
                </View>

                <Text style={s.city}>
                  <Ionicons name="location-outline" size={13} color={colors.textMuted} /> {r.city[lang]}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { padding: 18, paddingBottom: 10, gap: 4 },
  eyebrow: { color: colors.accent, fontSize: 10, fontFamily: font.extrabold, letterSpacing: 1.4 },
  heading: { fontSize: 24, lineHeight: 29, fontFamily: font.extrabold, color: colors.primary },
  subheading: { color: colors.textMuted, fontSize: 14 },
  zone: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, alignSelf: 'flex-start', backgroundColor: colors.accentTint, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  zoneText: { fontSize: 12, fontFamily: font.extrabold, color: colors.accent },
  list: { padding: 16, gap: 14 },
  card: { backgroundColor: colors.surface, borderRadius: 22, overflow: 'hidden' },
  pressed: { opacity: 0.85 },
  img: { width: '100%', height: 176 },
  counter: { position: 'absolute', right: 12, bottom: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)' },
  counterText: { color: colors.white, fontSize: 11, fontFamily: font.bold },
  rating: { position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' },
  ratingText: { fontSize: 12, fontFamily: font.extrabold, color: colors.primary },
  body: { padding: 14, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 18, fontFamily: font.extrabold, color: colors.primary },
  badge: { backgroundColor: colors.accentTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: colors.accent, fontSize: 12, fontFamily: font.extrabold },
  specs: { flexDirection: 'row', gap: 14 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 18, fontFamily: font.extrabold, color: colors.primary },
  per: { fontSize: 13, color: colors.textMuted, fontFamily: font.semibold },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentTint, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  detailText: { fontSize: 13, fontFamily: font.extrabold, color: colors.accent },
  city: { fontSize: 13, color: colors.textMuted, fontFamily: font.semibold },
});
