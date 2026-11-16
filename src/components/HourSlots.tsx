import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '@/theme';
import { HOURS } from '@/lib/dates';

type Props = {
  hours?: readonly number[];
  isBusy?: (hour: number) => boolean;
  isSelected?: (hour: number) => boolean;
  onSelect: (hour: number) => void;
};

const pad = (n: number) => String(n).padStart(2, '0');

export function HourSlots({ hours = HOURS, isBusy, isSelected, onSelect }: Props) {
  return (
    <View style={s.grid}>
      {hours.map((hour) => {
        const busy = !!isBusy?.(hour);
        const selected = !!isSelected?.(hour);
        return (
          <Pressable
            key={hour}
            disabled={busy}
            onPress={() => onSelect(hour)}
            style={({ pressed }) => [
              s.chip,
              busy && s.chipBusy,
              selected && s.chipOn,
              pressed && !busy && s.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, selected }}
          >
            <Text style={[s.text, busy && s.textBusy, selected && s.textOn]}>
              {pad(hour)}:00
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minWidth: 62,
    height: 38,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBusy: {
    backgroundColor: colors.dangerTint,
    borderColor: colors.dangerTint,
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  text: { fontSize: 13, fontFamily: font.bold, color: colors.primary },
  textBusy: { color: colors.danger, textDecorationLine: 'line-through' },
  textOn: { color: colors.white },
  pressed: { opacity: 0.7 },
});
