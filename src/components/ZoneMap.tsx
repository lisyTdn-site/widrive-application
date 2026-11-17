import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n } from '@/i18n';
import { MapView } from '@/components/MapView';
import type { MapPoint } from '@/components/mapHtml';
import { CALAVI } from '@/data/zones';

type Props = {
  points: MapPoint[];
  title?: string;
  height?: number;
  /** Retire le retrait horizontal quand le parent en fournit déjà un. */
  flush?: boolean;
  /** Centre utilisé par le bouton « itinéraire » (par défaut : Calavi). */
  center?: { lat: number; lng: number };
};

/** Carte d'une zone : affiche toutes les annonces en un coup d'œil. */
export function ZoneMap({ points, title, height = 220, flush = false, center = CALAVI.center }: Props) {
  const { t, tr } = useI18n();
  const open = () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`);

  return (
    <View style={[s.wrap, flush && s.flush]}>
      <View style={s.head}>
        <View style={s.headText}>
          <Text style={s.title}>{title ?? t('zone.mapTitle', { zone: tr(CALAVI.name) })}</Text>
          <Text style={s.sub}>{t('zone.mapSub', { n: points.length, zone: tr(CALAVI.name) })}</Text>
        </View>
        <View style={s.pill}>
          <Ionicons name="location" size={13} color={colors.accent} />
          <Text style={s.pillText}>{tr(CALAVI.short)}</Text>
        </View>
      </View>

      <View style={s.map}>
        <MapView points={points} zoom={CALAVI.zoom} height={height} />
      </View>

      <Pressable onPress={open} style={({ pressed }) => [s.btn, pressed && s.pressed]} accessibilityRole="link">
        <Ionicons name="navigate-outline" size={16} color={colors.accent} />
        <Text style={s.btnText}>{t('map.open')}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.sm },
  flush: { paddingHorizontal: 0 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  headText: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontFamily: font.extrabold, color: colors.primary },
  sub: { fontSize: 12, color: colors.textMuted },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentTint,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 12, fontFamily: font.extrabold, color: colors.accent },
  map: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.accentTint,
  },
  btnText: { fontSize: 14, fontFamily: font.extrabold, color: colors.accent },
  pressed: { opacity: 0.7 },
});
