import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { LANGS, useI18n } from '@/i18n';

export function LangSwitch({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <View style={[s.wrap, { backgroundColor: dark ? 'rgba(255,255,255,0.15)' : '#E9E9E5' }]}>
      {LANGS.map((l) => {
        const on = l.id === lang;
        return (
          <Pressable
            key={l.id}
            onPress={() => setLang(l.id)}
            accessibilityLabel={l.label}
            style={[s.btn, on && { backgroundColor: dark ? '#fff' : colors.primary }]}
          >
            <Text style={[s.text, { color: on ? (dark ? colors.primary : '#fff') : dark ? '#fff' : colors.textMuted }]}>
              {l.id.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 16, padding: 3 },
  btn: { paddingHorizontal: 12, height: 30, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 12, fontWeight: '800' },
});