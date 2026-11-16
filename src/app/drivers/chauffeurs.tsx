import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Chips } from '@/components/Chips';
import { Img } from '@/components/Img';
import { PaySheet } from '@/components/PaySheet';
import { chauffeurs, type Chauffeur } from '@/data/catalog';
import { money } from '@/lib/wallet';
import { useI18n, type Key } from '@/i18n';
import { colors, font } from '@/theme';

const DURATIONS = ['half', 'full'] as const;
type Dur = (typeof DURATIONS)[number];

export default function Chauffeurs() {
  const { t } = useI18n();
  const [dur, setDur] = useState<Dur>('full');
  const [pick, setPick] = useState<Chauffeur | null>(null);

  const priceOf = (c: Chauffeur) => (dur === 'full' ? c.priceDay : c.priceHalf);
  const durLabel = (d: Dur) => t(d === 'full' ? 'drv.full' : 'drv.half');

  return (
    <Screen title={t('drv.title')}>
      <Chips items={DURATIONS} value={dur} onChange={setDur} label={durLabel} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <View style={s.info}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
          <Text style={s.infoText}>{t('drv.verified')}</Text>
        </View>

        {chauffeurs.map((c) => (
          <View key={c.id} style={s.card}>
            <Img source={c.photo} style={s.photo} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.name}>{c.name}</Text>
              <View style={s.rate}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text style={s.rateText}>{c.rating} · {t('drv.exp', { n: c.years })}</Text>
              </View>
              <Text style={s.meta}>{c.langs.map((l) => t(`lang.${l}` as Key)).join(' · ')}</Text>
              <Text style={s.meta}>{c.vehicle}</Text>
              <View style={s.footer}>
                <Text style={s.price}>{money(priceOf(c))}</Text>
                <Pressable onPress={() => setPick(c)} style={s.btn}>
                  <Text style={s.btnText}>{t('drv.book')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <PaySheet
        visible={!!pick}
        title={pick ? `${pick.name} · ${durLabel(dur)}` : ''}
        amount={pick ? priceOf(pick) : 0}
        onClose={() => setPick(null)}
      />
    </Screen>
  );
}

const s = StyleSheet.create({
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.successTint, padding: 12, borderRadius: 14 },
  infoText: { color: colors.success, fontFamily: font.bold, fontSize: 13, flex: 1 },
  card: { flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: 20, padding: 12 },
  photo: { width: 92, height: 92, borderRadius: 18 },
  name: { fontSize: 17, fontFamily: font.extrabold, color: colors.primary },
  rate: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rateText: { fontSize: 13, fontFamily: font.bold, color: colors.primary },
  meta: { fontSize: 13, color: colors.textMuted },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  price: { fontSize: 16, fontFamily: font.extrabold, color: colors.primary },
  btn: { backgroundColor: colors.accent, paddingHorizontal: 18, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.white, fontFamily: font.extrabold, fontSize: 13 },
});