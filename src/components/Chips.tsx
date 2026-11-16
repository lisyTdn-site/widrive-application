import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, font } from '@/theme';

export function Chips<T extends string>({
  items, value, onChange, label,
}: { items: readonly T[]; value: T; onChange: (v: T) => void; label?: (v: T) => string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {items.map((it) => (
        <Pressable key={it} onPress={() => onChange(it)} style={[s.chip, value === it && s.on]}>
          <Text style={[s.text, value === it && s.textOn]}>{label ? label(it) : it}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { height: 38, paddingHorizontal: 16, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: 14, fontFamily: font.bold, color: colors.primary },
  textOn: { color: colors.white },
});