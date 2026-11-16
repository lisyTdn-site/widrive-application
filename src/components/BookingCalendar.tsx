import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n } from '@/i18n';
import { MonthCalendar } from '@/components/MonthCalendar';
import { HourSlots } from '@/components/HourSlots';
import { atHour, dateTimeLabel, HOURS, startOfDay } from '@/lib/dates';
import { isDayBusy, isHourBusy, isRangeBusy, type Booking } from '@/lib/bookings';

export type SlotIssue = 'invalid' | 'busy' | null;

export function slotIssue(
  items: Booking[],
  listingId: string,
  start: number | null,
  end: number | null
): SlotIssue {
  if (start == null || end == null) return null;
  if (end <= start) return 'invalid';
  if (isRangeBusy(items, listingId, start, end)) return 'busy';
  return null;
}

type Props = {
  listingId: string;
  items: Booking[];
  start: number | null;
  end: number | null;
  onChange: (start: number | null, end: number | null) => void;
  hours?: readonly number[];
  minDate?: Date;
};

type Field = 'start' | 'end';

export function BookingCalendar({ listingId, items, start, end, onChange, hours = HOURS, minDate }: Props) {
  const { t, lang } = useI18n();
  const [field, setField] = useState<Field>('start');
  const [month, setMonth] = useState<Date>(() =>
    startOfDay(start ? new Date(start) : new Date())
  );

  const startDate = start != null ? new Date(start) : null;
  const endDate = end != null ? new Date(end) : null;

  const activeDay = field === 'start'
    ? startDate ?? month
    : endDate ?? startDate ?? month;

  const selectDay = (day: Date) => {
    if (field === 'start') {
      const hour = startDate ? startDate.getHours() : 9;
      const next = atHour(day, hour).getTime();
      let nextEnd = end;
      if (nextEnd == null || nextEnd <= next) nextEnd = atHour(day, hour + 3).getTime();
      onChange(next, nextEnd);
      setField('end');
    } else {
      const hour = endDate ? endDate.getHours() : 12;
      onChange(start, atHour(day, hour).getTime());
    }
  };

  const selectHour = (hour: number) => {
    if (field === 'start') {
      const day = startDate ?? new Date();
      const next = atHour(day, hour).getTime();
      let nextEnd = end;
      if (nextEnd == null || nextEnd <= next) nextEnd = atHour(day, hour + 3).getTime();
      onChange(next, nextEnd);
      setField('end');
    } else {
      const day = endDate ?? startDate ?? new Date();
      onChange(start, atHour(day, hour).getTime());
    }
  };

  const hourBusy = (hour: number) => {
    const probe = field === 'end' ? Math.max(0, hour - 1) : hour;
    return isHourBusy(items, listingId, activeDay, probe);
  };

  const issue = slotIssue(items, listingId, start, end);

  return (
    <View style={{ gap: spacing.md }}>
      <View style={s.segment}>
        {(['start', 'end'] as const).map((value) => {
          const disabled = value === 'end' && start == null;
          const on = field === value;
          return (
            <Pressable
              key={value}
              disabled={disabled}
              onPress={() => setField(value)}
              style={[s.segItem, on && s.segOn, disabled && s.segDisabled]}
            >
              <Text style={[s.segText, on && s.segTextOn]}>
                {value === 'start' ? t('cal.start') : t('cal.end')}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={s.picked}>
        <View style={s.pickedRow}>
          <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
          <Text style={s.pickedText}>
            {start != null ? dateTimeLabel(start, lang) : t('cal.noSlot')}
          </Text>
        </View>
        <View style={s.pickedRow}>
          <Ionicons name="stop-circle-outline" size={18} color={colors.primary} />
          <Text style={s.pickedText}>
            {end != null ? dateTimeLabel(end, lang) : t('cal.noSlot')}
          </Text>
        </View>
      </View>

      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        onSelectDay={selectDay}
        minDate={minDate}
        isSelected={(d) =>
          (startDate != null && d.toDateString() === startDate.toDateString()) ||
          (endDate != null && d.toDateString() === endDate.toDateString())
        }
        isInRange={(d) =>
          startDate != null && endDate != null && d > startOfDay(startDate) && d < startOfDay(endDate)
        }
        isBusy={(d) => isDayBusy(items, listingId, d)}
      />

      <View>
        <Text style={s.hoursTitle}>{t('cal.hours')}</Text>
        <HourSlots hours={hours} isBusy={hourBusy} isSelected={(h) => {
          const day = activeDay;
          if (field === 'start') return startDate != null && h === startDate.getHours() && day.toDateString() === startDate.toDateString();
          return endDate != null && h === endDate.getHours() && day.toDateString() === endDate.toDateString();
        }} onSelect={selectHour} />
      </View>

      <View style={s.legend}>
        <Legend color={colors.success} label={t('cal.free')} />
        <Legend color={colors.danger} label={t('cal.busy')} />
        <Legend color={colors.accent} label={t('cal.selected')} />
      </View>

      {issue === 'invalid' && <Text style={s.warn}>{t('rent.slotInvalid')}</Text>}
      {issue === 'busy' && <Text style={s.warn}>{t('rent.slotBusy')}</Text>}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segItem: { flex: 1, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.primary },
  segDisabled: { opacity: 0.4 },
  segText: { fontSize: 14, fontFamily: font.extrabold, color: colors.textMuted },
  segTextOn: { color: colors.white },
  picked: { gap: 6 },
  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickedText: { fontSize: 14, fontFamily: font.bold, color: colors.primary },
  hoursTitle: { fontSize: 14, fontFamily: font.extrabold, color: colors.primary, marginBottom: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: font.semibold, color: colors.textMuted },
  warn: { fontSize: 13, fontFamily: font.bold, color: colors.danger },
});
