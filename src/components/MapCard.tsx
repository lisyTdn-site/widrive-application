import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n } from '@/i18n';
import { MapView } from '@/components/MapView';

type Props = {
  lat: number;
  lng: number;
  label?: string;
  title?: string;
  height?: number;
};

export function MapCard({ lat, lng, label, title, height = 200 }: Props) {
  const { t } = useI18n();
  const open = () =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);

  return (
    <View style={{ gap: spacing.sm }}>
      {title ? <Text style={s.title}>{title}</Text> : null}
      <View style={s.map}>
        <MapView lat={lat} lng={lng} label={label} height={height} />
      </View>
      <Pressable
        onPress={open}
        style={({ pressed }) => [s.btn, pressed && s.pressed]}
        accessibilityRole="link"
      >
        <Ionicons name="navigate-outline" size={16} color={colors.accent} />
        <Text style={s.btnText}>{t('map.open')}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 17, fontFamily: font.extrabold, color: colors.primary },
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
