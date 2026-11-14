import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export function Spec({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={15} color={colors.textMuted} />
      <Text style={s.text}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});