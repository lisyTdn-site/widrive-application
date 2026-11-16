import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, font } from '@/theme';
import { useI18n, type Key } from '@/i18n';

const BALANCE = 45000; // fictif, à remplacer par l'API

const categories = [
  { id: 'eco', name: 'Eco', desc: 'ride.ecoDesc', eta: '3 min', price: 2000 },
  { id: 'confort', name: 'Confort', desc: 'ride.comfortDesc', eta: '4 min', price: 2800 },
  { id: 'van', name: 'Van', desc: 'ride.vanDesc', eta: '7 min', price: 4500 },
];

type Pay = 'wallet' | 'momo';

const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default function Ride() {
  const { t } = useI18n();
  const [from, setFrom] = useState(t('ride.current'));
  const [to, setTo] = useState('');
  const [catId, setCatId] = useState('confort');
  const [pay, setPay] = useState<Pay>('wallet');

  const cat = categories.find((c) => c.id === catId) ?? categories[0];
  const insufficient = pay === 'wallet' && cat.price > BALANCE;
  const canConfirm = to.trim().length > 2 && from.trim().length > 2 && !insufficient;

  const confirm = () => {
    if (!canConfirm) return;
    router.push({
      pathname: '/trip',
      params: { cat: cat.name, pay, price: String(cat.price), to: to.trim() },
    } as never);
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      <View style={s.map}>
        <Ionicons name="map-outline" size={40} color={colors.textMuted} />
        <Text style={s.mapText}>{t('ride.map')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('ride.back')} onPress={() => router.back()} style={s.back}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={s.sheet} contentContainerStyle={s.sheetContent} keyboardShouldPersistTaps="handled">
        <View style={s.route}>
          <View style={s.routeRow}>
            <View style={s.dotFrom} />
            <View style={{ flex: 1 }}>
              <Text style={s.small}>{t('ride.departure')}</Text>
              <TextInput value={from} onChangeText={setFrom} style={s.routeInput} />
            </View>
          </View>
          <View style={s.routeRow}>
            <View style={s.dotTo} />
            <View style={{ flex: 1 }}>
              <Text style={s.small}>{t('ride.destination')}</Text>
              <TextInput
                value={to}
                onChangeText={setTo}
                placeholder={t('ride.destinationPh')}
                placeholderTextColor={colors.textMuted}
                style={s.routeInput}
              />
            </View>
          </View>
        </View>

        <Text style={s.section}>{t('ride.chooseVehicle')}</Text>
        {categories.map((c) => {
          const on = c.id === catId;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setCatId(c.id)}
              style={[s.cat, on && s.catOn]}
            >
              <View style={[s.catIcon, on && { backgroundColor: colors.accentTint }]}>
                <Ionicons name="car-outline" size={26} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.catName, on && { fontFamily: font.extrabold }]}>{c.name}</Text>
                <Text style={s.small}>{t(c.desc as Key)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.catPrice}>{fmt(c.price)} FCFA</Text>
                <Text style={s.small}>{c.eta}</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={s.section}>{t('ride.payment')}</Text>
        <View style={s.payRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: pay === 'wallet' }}
            onPress={() => setPay('wallet')}
            style={[s.pay, pay === 'wallet' && s.payOn]}
          >
            <Ionicons name="wallet-outline" size={20} color={pay === 'wallet' ? colors.white : colors.primary} />
            <Text style={[s.payText, pay === 'wallet' && { color: colors.white }]}>{t('ride.balance')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: pay === 'momo' }}
            onPress={() => setPay('momo')}
            style={[s.pay, pay === 'momo' && s.payOn]}
          >
            <Ionicons name="phone-portrait-outline" size={20} color={pay === 'momo' ? colors.white : colors.primary} />
            <Text style={[s.payText, pay === 'momo' && { color: colors.white }]}>Mobile Money</Text>
          </Pressable>
        </View>

        {insufficient ? (
          <View style={s.warn}>
            <Text style={s.warnText}>{t('ride.insufficient', { amount: fmt(BALANCE) })}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/wallet', params: { mode: 'dep' } } as never)}
            >
              <Text style={s.warnLink}>{t('ride.topup')}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={s.note}>
            {pay === 'wallet'
              ? t('ride.noteWallet', { amount: fmt(BALANCE) })
              : t('ride.noteMomo')}
          </Text>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canConfirm }}
          onPress={confirm}
          style={[s.cta, !canConfirm && s.ctaOff]}
        >
          <Text style={s.ctaText}>{t('ride.confirm', { amount: fmt(cat.price) })}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.border },
  map: { height: 190, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapText: { color: colors.textMuted, fontSize: 14, fontFamily: font.semibold },
  back: {
    position: 'absolute', top: 12, left: 20, width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sheet: { flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetContent: { padding: 20, gap: 10 },
  small: { fontSize: 12, color: colors.textMuted },
  route: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 8 },
  routeInput: { fontSize: 15, fontFamily: font.bold, color: colors.primary, paddingVertical: 2 },
  dotFrom: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: colors.primary },
  dotTo: { width: 12, height: 12, borderRadius: 3, backgroundColor: colors.accent },
  section: { fontSize: 16, fontFamily: font.extrabold, color: colors.primary, marginTop: 8 },
  cat: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16,
    borderWidth: 2, borderColor: colors.border,
  },
  catOn: { borderColor: colors.primary, backgroundColor: colors.background },
  catIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontFamily: font.bold, color: colors.primary },
  catPrice: { fontSize: 15, fontFamily: font.extrabold, color: colors.primary },
  payRow: { flexDirection: 'row', gap: 10 },
  pay: {
    flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', gap: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border,
  },
  payOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  payText: { fontSize: 13, fontFamily: font.extrabold, color: colors.primary },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  warn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderRadius: 12, backgroundColor: colors.accentTint,
  },
  warnText: { fontSize: 13, fontFamily: font.bold, color: colors.primary },
  warnLink: { fontSize: 14, fontFamily: font.extrabold, color: colors.accent, paddingVertical: 6 },
  cta: { height: 56, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  ctaOff: { opacity: 0.45 },
  ctaText: { color: colors.white, fontSize: 16, fontFamily: font.extrabold },
});
