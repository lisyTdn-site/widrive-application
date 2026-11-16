import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n } from '@/i18n';
import {
  addMonths,
  isBefore,
  monthLabel,
  monthMatrix,
  sameDay,
  startOfDay,
  WEEKDAYS,
} from '@/lib/dates';

type Props = {
  month: Date;
  onMonthChange: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  isSelected?: (d: Date) => boolean;
  isInRange?: (d: Date) => boolean;
  isBusy?: (d: Date) => boolean;
  minDate?: Date;
};

export function MonthCalendar({
  month,
  onMonthChange,
  onSelectDay,
  isSelected,
  isInRange,
  isBusy,
  minDate,
}: Props) {
  const { t, lang } = useI18n();
  const cells = monthMatrix(month);
  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(minDate) : today;

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <Pressable
          onPress={() => onMonthChange(addMonths(month, -1))}
          style={({ pressed }) => [s.nav, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('cal.prev')}
        >
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </Pressable>
        <Text style={s.month}>{monthLabel(month, lang)}</Text>
        <Pressable
          onPress={() => onMonthChange(addMonths(month, 1))}
          style={({ pressed }) => [s.nav, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('cal.next')}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <View style={s.week}>
        {WEEKDAYS[lang].map((label, index) => (
          <Text key={`${label}-${index}`} style={s.weekText}>{label}</Text>
        ))}
      </View>

      <View style={s.grid}>
        {cells.map((cell, index) => {
          if (!cell) return <View key={`empty-${index}`} style={s.cell} />;

          const disabled = isBefore(cell, min);
          const selected = !!isSelected?.(cell);
          const inRange = !!isInRange?.(cell) && !selected;
          const busy = !!isBusy?.(cell);
          const isToday = sameDay(cell, today);

          return (
            <Pressable
              key={cell.toISOString()}
              disabled={disabled}
              onPress={() => onSelectDay(cell)}
              style={s.cell}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected }}
            >
              <View
                style={[
                  s.day,
                  inRange && s.dayRange,
                  isToday && !selected && s.dayToday,
                  selected && s.daySelected,
                ]}
              >
                <Text
                  style={[
                    s.dayText,
                    disabled && s.dayDisabled,
                    inRange && s.dayTextRange,
                    selected && s.dayTextSelected,
                  ]}
                >
                  {cell.getDate()}
                </Text>
              </View>
              <View style={[s.dot, busy && !selected && s.dotBusy]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  nav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  month: { fontSize: 16, fontFamily: font.extrabold, color: colors.primary },
  week: { flexDirection: 'row', marginBottom: 4 },
  weekText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: font.bold,
    color: colors.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { borderWidth: 1, borderColor: colors.accent },
  dayRange: { backgroundColor: colors.accentTint },
  daySelected: { backgroundColor: colors.accent },
  dayText: { fontSize: 14, fontFamily: font.semibold, color: colors.primary },
  dayTextRange: { color: colors.accent },
  dayTextSelected: { color: colors.white, fontFamily: font.extrabold },
  dayDisabled: { color: colors.border },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2, backgroundColor: 'transparent' },
  dotBusy: { backgroundColor: colors.danger },
  pressed: { opacity: 0.6 },
});
