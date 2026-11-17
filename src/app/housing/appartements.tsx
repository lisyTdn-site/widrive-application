import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Chips } from '@/components/Chips';
import { Img } from '@/components/Img';
import { Spec } from '@/components/Spec';
import { ZoneMap } from '@/components/ZoneMap';
import { apartments } from '@/data/catalog';
import { CALAVI } from '@/data/zones';
import { money } from '@/lib/wallet';
import { useI18n, type Key } from '@/i18n';
import { colors, font } from '@/theme';

const TYPES = ['all', 'studio', 'two', 'three', 'villa'] as const;
type TypeF = (typeof TYPES)[number];

export default function Appartements() {
  const { t, tr } = useI18n();
  const [type, setType] = useState<TypeF>('all');
  const list = apartments.filter((a) => type === 'all' || a.type === type);
  const typeLabel = (x: TypeF) => (x === 'all' ? t('common.all') : t(`apt.type.${x}` as Key));

  return (
    <Screen title={t('apt.title')}>
      <Chips items={TYPES} value={type} onChange={setType} label={typeLabel} />
      <ZoneMap
        points={list.map((a) => ({ lat: a.lat, lng: a.lng, label: tr(a.title) }))}
        title={t('zone.housingTitle', { zone: tr(CALAVI.name) })}
        height={200}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {list.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => router.push(`/housing/${a.id}` as never)}
            style={({ pressed }) => [s.card, pressed && s.pressed]}
            accessibilityRole="button"
          >
            <View>
              <Img source={a.image} style={s.img} />
              <View style={s.counter}>
                <Text style={s.counterText}>{t('apt.photos', { n: a.photos.length })}</Text>
              </View>
              <View style={s.rating}>
                <Ionicons name="star" size={13} color={colors.gold} />
                <Text style={s.ratingText}>{a.rating.toFixed(1).replace('.', ',')}</Text>
              </View>
            </View>

            <View style={s.body}>
              <View style={s.row}>
                <Text style={s.title}>{tr(a.title)}</Text>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{typeLabel(a.type)}</Text>
                </View>
              </View>

              <View style={s.loc}>
                <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                <Text style={s.area}>{tr(a.area)}</Text>
              </View>

              <View style={s.specs}>
                <Spec icon="bed-outline" text={t('apt.beds', { n: a.beds })} />
                <Spec icon="water-outline" text={t('apt.baths', { n: a.baths })} />
                <Spec icon="resize-outline" text={`${a.size} m²`} />
              </View>

              <View style={s.foot}>
                <Text style={s.price}>
                  {money(a.pricePerMonth)} <Text style={s.per}>{t('apt.perMonth')}</Text>
                </Text>
                <View style={s.detail}>
                  <Text style={s.detailText}>{t('apt.availability')}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.accent} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' },
  pressed: { opacity: 0.85 },
  img: { width: '100%', height: 190 },
  counter: { position: 'absolute', right: 12, bottom: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)' },
  counterText: { color: colors.white, fontSize: 11, fontFamily: font.bold },
  rating: { position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.92)' },
  ratingText: { fontSize: 12, fontFamily: font.extrabold, color: colors.primary },
  body: { padding: 14, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 18, fontFamily: font.extrabold, color: colors.primary },
  badge: { backgroundColor: colors.accentTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: colors.accent, fontSize: 12, fontFamily: font.extrabold },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  area: { fontSize: 14, color: colors.textMuted, fontFamily: font.semibold },
  specs: { flexDirection: 'row', gap: 14 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 18, fontFamily: font.extrabold, color: colors.primary },
  per: { fontSize: 13, color: colors.textMuted, fontFamily: font.semibold },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentTint, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  detailText: { fontSize: 13, fontFamily: font.extrabold, color: colors.accent },
});
