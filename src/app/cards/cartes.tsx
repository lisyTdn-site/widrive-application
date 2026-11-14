import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Img } from '@/components/Img';
import { PaySheet } from '@/components/PaySheet';
import { images } from '@/data/images';
import { fmt, money } from '@/lib/wallet';
import { useI18n } from '@/i18n';
import { colors } from '@/theme/colors';

const CARD_FEE = 2000; // frais de création : à définir
const TOPUPS = [5000, 10000, 25000, 50000];

type Card = { id: number; number: string; exp: string; balance: number; frozen: boolean; shown: boolean };
type Intent = { type: 'create' } | { type: 'topup'; id: number } | null;

const makeNumber = (n: number) => `4${String(100 + n)} 2${String(300 + n)} 7788 ${String(1000 + n * 37).slice(0, 4)}`;

export default function Cartes() {
  const { t } = useI18n();
  const [cards, setCards] = useState<Card[]>([
    { id: 1, number: makeNumber(1), exp: '09/29', balance: 12000, frozen: false, shown: false },
  ]);
  const [intent, setIntent] = useState<Intent>(null);
  const [topup, setTopup] = useState(10000);

  const update = (id: number, patch: Partial<Card>) =>
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const amount = intent?.type === 'create' ? CARD_FEE : topup;
  const title = intent?.type === 'create' ? t('card.payCreate') : t('card.payTopup', { amount: money(topup) });

  const onPaid = () => {
    if (intent?.type === 'create') {
      const id = Date.now();
      setCards((cs) => [...cs, { id, number: makeNumber(cs.length + 1), exp: '09/29', balance: 0, frozen: false, shown: false }]);
    } else if (intent?.type === 'topup') {
      const card = cards.find((c) => c.id === intent.id);
      if (card) update(card.id, { balance: card.balance + topup });
    }
  };

  const show = (c: Card) => (c.shown ? c.number : `•••• •••• •••• ${c.number.slice(-4)}`);

  return (
    <Screen title={t('card.title')}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <Img source={images.hero.cards} style={s.hero} />

        {cards.map((c) => (
          <View key={c.id} style={{ gap: 12 }}>
            <View style={[s.card, c.frozen && { opacity: 0.45 }]}>
              <View style={s.cardTop}>
                <Text style={s.brand}>WIDRIVE</Text>
                <Pressable onPress={() => update(c.id, { shown: !c.shown })} hitSlop={10}>
                  <Ionicons name={c.shown ? 'eye-off-outline' : 'eye-outline'} size={22} color="#fff" />
                </Pressable>
              </View>
              <Text style={s.number}>{show(c)}</Text>
              <View style={s.cardBottom}>
                <View>
                  <Text style={s.small}>{t('card.expires')}</Text>
                  <Text style={s.val}>{c.exp}</Text>
                </View>
                <View>
                  <Text style={s.small}>CVV</Text>
                  <Text style={s.val}>{c.shown ? '123' : '•••'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.small}>{t('card.balance')}</Text>
                  <Text style={s.val}>{money(c.balance)}</Text>
                </View>
              </View>
            </View>

            <View style={s.panel}>
              <View style={s.rowBetween}>
                <Text style={s.panelTitle}>{t('card.freeze')}</Text>
                <Switch value={c.frozen} onValueChange={(v) => update(c.id, { frozen: v })} trackColor={{ true: colors.accent }} />
              </View>
              <Text style={s.panelLabel}>{t('card.topup')}</Text>
              <View style={s.chips}>
                {TOPUPS.map((x) => (
                  <Pressable key={x} onPress={() => setTopup(x)} style={[s.chip, topup === x && s.chipOn]}>
                    <Text style={[s.chipText, topup === x && { color: '#fff' }]}>{fmt(x)}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable disabled={c.frozen} onPress={() => setIntent({ type: 'topup', id: c.id })} style={[s.cta, c.frozen && { opacity: 0.4 }]}>
                <Text style={s.ctaText}>{t('card.topupCta', { amount: money(topup) })}</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable onPress={() => setIntent({ type: 'create' })} style={s.add}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={s.addText}>{t('card.create', { amount: money(CARD_FEE) })}</Text>
        </Pressable>
        <Text style={s.note}>{t('card.note')}</Text>
      </ScrollView>

      <PaySheet visible={!!intent} title={title} amount={amount} onPaid={onPaid} onClose={() => setIntent(null)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { width: '100%', height: 130, borderRadius: 20 },
  card: { backgroundColor: colors.primary, borderRadius: 22, padding: 20, gap: 22, borderWidth: 2, borderColor: colors.accent },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 2 },
  number: { color: '#fff', fontSize: 21, fontWeight: '700', letterSpacing: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { color: colors.onDark, fontSize: 11 },
  val: { color: '#fff', fontSize: 14, fontWeight: '800' },
  panel: { backgroundColor: '#fff', borderRadius: 18, padding: 14, gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontSize: 15, fontWeight: '800', color: colors.primary },
  panelLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  cta: { height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  add: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary },
  addText: { fontWeight: '800', color: colors.primary, fontSize: 14 },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});