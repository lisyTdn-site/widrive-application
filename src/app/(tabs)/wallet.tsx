import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/theme/colors';
import { useI18n, type Key } from '@/i18n';
import { Chips } from '@/components/Chips';
import { BALANCE, money } from '@/lib/wallet';
import { cardsSummary, holdings } from '@/data/holdings';

type Filter = 'all' | 'in' | 'out';

type Tx = {
  id: string;
  kind: 'in' | 'out';
  label: Key;
  date: string;
  amount: number;
};

// Historique de démonstration : à remplacer par l'API.
const history: Tx[] = [
  { id: 't1', kind: 'in', label: 'wal.deposit', date: '27/10/2026', amount: 50000 },
  { id: 't2', kind: 'out', label: 'act.rental', date: '25/10/2026', amount: 20000 },
  { id: 't3', kind: 'out', label: 'cry.title', date: '22/10/2026', amount: 15000 },
  { id: 't4', kind: 'in', label: 'wal.deposit', date: '18/10/2026', amount: 30000 },
  { id: 't5', kind: 'out', label: 'wal.withdraw', date: '15/10/2026', amount: 10000 },
];

const assets = [
  { id: 'usdt', name: 'USDT', value: String(holdings.usdt) },
  { id: 'btc', name: 'BTC', value: String(holdings.btc) },
  { id: 'eth', name: 'ETH', value: String(holdings.eth) },
];

export default function WalletTab() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>('all');

  const rows = history.filter(
    (h) => filter === 'all' || h.kind === filter
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />

      <ScrollView
        style={s.body}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={s.header}>
          <Text style={s.title}>{t('nav.wallet')}</Text>

          <Text style={s.label}>{t('hm.balance')}</Text>
          <Text style={s.balance}>{money(BALANCE)}</Text>

          <View style={s.actions}>
            <Pressable
              style={s.action}
              onPress={() => router.push('/transfer?mode=dep' as never)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={s.actionText}>{t('hm.deposit')}</Text>
            </Pressable>

            <Pressable
              style={s.action}
              onPress={() => router.push('/transfer?mode=ret' as never)}
            >
              <Ionicons name="arrow-up-circle-outline" size={20} color="#fff" />
              <Text style={s.actionText}>{t('hm.withdraw')}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={s.section}>{t('wt.assets')}</Text>

        <View style={s.card}>
          {assets.map((a, i) => (
            <View key={a.id} style={[s.row, i > 0 && s.sep]}>
              <View style={s.coin}>
                <Ionicons
                  name="logo-bitcoin"
                  size={18}
                  color={colors.accent}
                />
              </View>

              <Text style={s.rowTitle}>{a.name}</Text>
              <Text style={s.rowValue}>{a.value}</Text>
            </View>
          ))}

          <View style={[s.row, s.sep]}>
            <View style={s.coin}>
              <Ionicons
                name="card-outline"
                size={18}
                color={colors.accent}
              />
            </View>

            <Text style={s.rowTitle}>
              {t('wt.cards', { n: cardsSummary.count })}
            </Text>

            <Text style={s.rowValue}>
              {money(cardsSummary.balance)}
            </Text>
          </View>
        </View>

        <Text style={s.section}>{t('wt.history')}</Text>

        <Chips
          items={['all', 'in', 'out'] as const}
          value={filter}
          onChange={setFilter}
          label={(v) =>
            t(v === 'all' ? 'wt.all' : v === 'in' ? 'wt.in' : 'wt.out')
          }
        />

        <View style={s.card}>
          {rows.length === 0 && (
            <Text style={s.empty}>{t('wt.empty')}</Text>
          )}

          {rows.map((h, i) => (
            <View key={h.id} style={[s.row, i > 0 && s.sep]}>
              <View
                style={[
                  s.coin,
                  {
                    backgroundColor:
                      h.kind === 'in' ? '#E3F4EA' : colors.accentTint,
                  },
                ]}
              >
                <Ionicons
                  name={h.kind === 'in' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={
                    h.kind === 'in' ? colors.success : colors.accent
                  }
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{t(h.label)}</Text>
                <Text style={s.date}>{h.date}</Text>
              </View>

              <Text
                style={[
                  s.rowValue,
                  {
                    color:
                      h.kind === 'in' ? colors.success : colors.primary,
                  },
                ]}
              >
                {h.kind === 'in' ? '+' : '-'}
                {money(h.amount)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  body: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 6,
  },

  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },

  label: {
    color: colors.onDark,
    fontSize: 13,
    fontWeight: '600',
  },

  balance: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
  },

  action: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  actionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  section: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },

  sep: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  coin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },

  rowValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },

  date: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    paddingVertical: 20,
  },
});