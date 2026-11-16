import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { colors, font } from '@/theme';
import { useI18n } from '@/i18n';

export default function Bientot() {
  const { title } = useLocalSearchParams<{ title?: string }>();
  const { t } = useI18n();

  return (
    <Screen title={title ?? ''}>
      <View style={s.center}>
        <View style={s.icon}>
          <Ionicons name="construct-outline" size={40} color={colors.accent} />
        </View>
        <Text style={s.text}>{t('soon.text')}</Text>
        <Pressable onPress={() => router.back()} style={s.btn}>
          <Text style={s.btnText}>{t('soon.back')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 18 },
  icon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, lineHeight: 24, color: colors.primary, textAlign: 'center', fontFamily: font.semibold },
  btn: { height: 52, paddingHorizontal: 24, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.white, fontFamily: font.extrabold, fontSize: 14 },
});