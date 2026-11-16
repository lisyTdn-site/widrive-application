import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, font, radius, spacing } from '@/theme';
import { useI18n, type Key } from '@/i18n';
import { Chips } from '@/components/Chips';
import { MonthCalendar } from '@/components/MonthCalendar';
import { fmt, money, useWallet, type Tx } from '@/lib/wallet';
import { downloadCsv } from '@/lib/csv';
import { cardsSummary, holdings } from '@/data/holdings';
import { addDays, dayLabel, startOfDay } from '@/lib/dates';

type Period = 'all' | 'day' | 'week' | 'month' | 'custom';
type Dir = 'all' | 'in' | 'out';

const PERIODS = ['all', 'day', 'week', 'month', 'custom'] as const;
const DIRS = ['all', 'in', 'out'] as const;

const assets = [
  { id: 'usdt', name: 'USDT', value: String(holdings.usdt) },
  { id: 'btc', name: 'BTC', value: String(holdings.btc) },
  { id: 'eth', name: 'ETH', value: String(holdings.eth) },
];

function rangeOf(period: Period, from: Date, to: Date): [number, number] {
  const now = Date.now();
  if (period === 'day') return [startOfDay(new Date()).getTime(), now];
  if (period === 'week') return [startOfDay(addDays(new Date(), -6)).getTime(), now];
  if (period === 'month') return [startOfDay(addDays(new Date(), -29)).getTime(), now];
  if (period === 'custom') {
    const start = startOfDay(from).getTime();
    const end = startOfDay(to).getTime() + 86_399_999;
    return [Math.min(start, end), Math.max(start, end)];
  }
  return [0, now];
}

export default function WalletTab() {
  const { t, lang } = useI18n();
  const { balance, txs } = useWallet();

  const [period, setPeriod] = useState<Period>('all');
  const [dir, setDir] = useState<Dir>('all');
  const [from, setFrom] = useState(() => addDays(new Date(), -7));
  const [to, setTo] = useState(() => new Date());
  const [pick, setPick] = useState<null | 'from' | 'to'>(null);
  const [done, setDone] = useState(false);

  const [start, end] = rangeOf(period, from, to);

  const rows = useMemo(
    () =>
      txs
        .filter((tx) => tx.at >= start && tx.at <= end)
        .filter((tx) => dir === 'all' || tx.kind === dir)
        .sort((a, b) => b.at - a.at),
    [txs, start, end, dir]
  );

  const totalIn = useMemo(
    () => txs.filter((tx) => tx.at >= start && tx.at <= end && tx.kind === 'in').reduce((sum, tx) => sum + tx.amount, 0),
    [txs, start, end]
  );
  const totalOut = useMemo(
    () => txs.filter((tx) => tx.at >= start && tx.at <= end && tx.kind === 'out').reduce((sum, tx) => sum + tx.amount, 0),
    [txs, start, end]
  );

  const periodLabel = (p: Period) =>
    t(`wt.period${p === 'all' ? 'All' : p === 'day' ? 'Day' : p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'Custom'}` as Key);

  const dirLabel = (d: Dir) => t(d === 'all' ? 'wt.all' : d === 'in' ? 'wt.in' : 'wt.out');

  const txLabel = (tx: Tx) => (tx.labelText ? tx.labelText : t(tx.labelKey as Key, tx.vars));
  const methodLabel = (tx: Tx) => (tx.method ? t(`wt.method.${tx.method}` as Key) : '');

  const exportCsv = async () => {
    const header = [t('wt.col.date'), t('wt.col.label'), t('wt.col.type'), t('wt.col.method'), t('wt.col.amount')];
    const body = rows.map((tx) => [
      new Date(tx.at).toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR'),
      txLabel(tx),
      tx.kind === 'in' ? t('wt.typeIn') : t('wt.typeOut'),
      methodLabel(tx),
      `${tx.kind === 'in' ? '' : '-'}${fmt(tx.amount)}`,
    ]);
    const stamp = new Date().toISOString().slice(0, 10);
    await downloadCsv(`widrive-historique-${stamp}.csv`, [header, ...body]);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={s.header}>
          <Text style={s.title}>{t('nav.wallet')}</Text>
          <Text style={s.label}>{t('home.balance')}</Text>
          <Text style={s.balance}>{money(balance)}</Text>

          <View style={s.actions}>
            <Pressable
              style={({ pressed }) => [s.action, pressed && s.pressed]}
              onPress={() => router.push('/transfer?mode=dep' as never)}
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.white} />
              <Text style={s.actionText}>{t('home.deposit')}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [s.action, pressed && s.pressed]}
              onPress={() => router.push('/transfer?mode=ret' as never)}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-up-circle-outline" size={20} color={colors.white} />
              <Text style={s.actionText}>{t('home.withdraw')}</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [s.bookings, pressed && s.pressed]}
            onPress={() => router.push('/bookings' as never)}
            accessibilityRole="button"
          >
            <Ionicons name="calendar-outline" size={16} color={colors.white} />
            <Text style={s.bookingsText}>{t('wt.myBookings')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.white} />
          </Pressable>
        </View>

        <Text style={s.section}>{t('wt.assets')}</Text>

        <View style={s.card}>
          {assets.map((a, i) => (
            <View key={a.id} style={[s.row, i > 0 && s.sep]}>
              <View style={s.coin}>
                <Ionicons name="logo-bitcoin" size={18} color={colors.accent} />
              </View>
              <Text style={s.rowTitle}>{a.name}</Text>
              <Text style={s.rowValue}>{a.value}</Text>
            </View>
          ))}

          <View style={[s.row, s.sep]}>
            <View style={s.coin}>
              <Ionicons name="card-outline" size={18} color={colors.accent} />
            </View>
            <Text style={s.rowTitle}>{t('wt.cards', { n: cardsSummary.count })}</Text>
            <Text style={s.rowValue}>{money(cardsSummary.balance)}</Text>
          </View>
        </View>

        <Text style={s.section}>{t('wt.history')}</Text>

        <Text style={s.filterLabel}>{t('wt.period')}</Text>
        <Chips items={PERIODS} value={period} onChange={setPeriod} label={periodLabel} />

        {period === 'custom' ? (
          <View style={s.rangeRow}>
            <Pressable style={s.rangeBtn} onPress={() => setPick('from')}>
              <Text style={s.rangeLabel}>{t('wt.from')}</Text>
              <Text style={s.rangeValue}>{dayLabel(from, lang)}</Text>
            </Pressable>
            <Pressable style={s.rangeBtn} onPress={() => setPick('to')}>
              <Text style={s.rangeLabel}>{t('wt.to')}</Text>
              <Text style={s.rangeValue}>{dayLabel(to, lang)}</Text>
            </Pressable>
          </View>
        ) : null}

        <Chips items={DIRS} value={dir} onChange={setDir} label={dirLabel} />

        <View style={s.summary}>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>{t('wt.totalIn')}</Text>
            <Text style={[s.summaryValue, { color: colors.success }]}>+{money(totalIn)}</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryLabel}>{t('wt.totalOut')}</Text>
            <Text style={[s.summaryValue, { color: colors.accent }]}>-{money(totalOut)}</Text>
          </View>
        </View>

        <View style={s.toolbar}>
          <Text style={s.count}>{t('wt.count', { n: rows.length })}</Text>
          <Pressable
            onPress={exportCsv}
            disabled={rows.length === 0}
            style={({ pressed }) => [s.download, rows.length === 0 && s.downloadOff, pressed && s.pressed]}
            accessibilityRole="button"
          >
            <Ionicons name="download-outline" size={16} color={colors.white} />
            <Text style={s.downloadText}>{t('wt.download')}</Text>
          </Pressable>
        </View>
        {done ? <Text style={s.doneText}>{t('wt.downloaded')}</Text> : null}

        <View style={s.card}>
          {rows.length === 0 && <Text style={s.empty}>{t('wt.noResults')}</Text>}

          {rows.map((tx, i) => (
            <View key={tx.id} style={[s.row, i > 0 && s.sep]}>
              <View
                style={[
                  s.coin,
                  { backgroundColor: tx.kind === 'in' ? colors.successTint : colors.accentTint },
                ]}
              >
                <Ionicons
                  name={tx.kind === 'in' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={tx.kind === 'in' ? colors.success : colors.accent}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle} numberOfLines={1}>{txLabel(tx)}</Text>
                <Text style={s.date}>
                  {new Date(tx.at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR')}
                  {tx.method ? ` · ${methodLabel(tx)}` : ''}
                </Text>
              </View>

              <Text
                style={[s.rowValue, { color: tx.kind === 'in' ? colors.success : colors.primary }]}
              >
                {tx.kind === 'in' ? '+' : '-'}{money(tx.amount)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={pick !== null} transparent animationType="fade" onRequestClose={() => setPick(null)}>
        <Pressable style={s.overlay} onPress={() => setPick(null)}>
          <Pressable style={s.sheet} onPress={() => undefined}>
            <Text style={s.sheetTitle}>{pick === 'from' ? t('wt.from') : t('wt.to')}</Text>
            <MonthCalendar
              month={pick === 'from' ? from : to}
              onMonthChange={() => undefined}
              onSelectDay={(d) => {
                if (pick === 'from') setFrom(d);
                else setTo(d);
                setPick(null);
              }}
              isSelected={(d) => d.toDateString() === (pick === 'from' ? from : to).toDateString()}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  body: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    gap: 6,
  },
  title: { color: colors.white, fontSize: 20, fontFamily: font.extrabold, marginBottom: spacing.sm },
  label: { color: colors.onDark, fontSize: 13, fontFamily: font.semibold },
  balance: { color: colors.white, fontSize: 32, fontFamily: font.extrabold, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionText: { color: colors.white, fontFamily: font.extrabold, fontSize: 14 },
  bookings: {
    marginTop: spacing.md,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bookingsText: { color: colors.white, fontFamily: font.bold, fontSize: 14, flex: 1, marginLeft: 2 },
  section: {
    fontSize: 17,
    fontFamily: font.extrabold,
    color: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: font.bold,
    color: colors.textMuted,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  sep: { borderTopWidth: 1, borderTopColor: colors.border },
  coin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { flex: 1, fontSize: 15, fontFamily: font.bold, color: colors.primary },
  rowValue: { fontSize: 14, fontFamily: font.extrabold, color: colors.primary },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  rangeRow: { flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  rangeBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  rangeLabel: { fontSize: 11, fontFamily: font.bold, color: colors.textMuted },
  rangeValue: { fontSize: 15, fontFamily: font.extrabold, color: colors.primary },
  summary: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  summaryLabel: { fontSize: 12, fontFamily: font.semibold, color: colors.textMuted },
  summaryValue: { fontSize: 16, fontFamily: font.extrabold },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  count: { fontSize: 13, fontFamily: font.bold, color: colors.textMuted },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  downloadOff: { opacity: 0.4 },
  downloadText: { color: colors.white, fontFamily: font.extrabold, fontSize: 13 },
  doneText: { marginHorizontal: spacing.lg, marginTop: spacing.sm, fontSize: 13, fontFamily: font.bold, color: colors.success },
  empty: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.xl },
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xxl },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  sheetTitle: { fontSize: 17, fontFamily: font.extrabold, color: colors.primary },
  pressed: { opacity: 0.75 },
});
